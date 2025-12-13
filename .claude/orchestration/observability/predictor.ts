/**
 * Predictor
 *
 * Establishes time-series forecasting for capacity planning and trend analysis
 * to drive proactive resource management across the platform.
 */

import Database from 'better-sqlite3';
import { Prediction, PredictionPoint, PredictorConfig, PredictionMethod } from './types.js';

export class Predictor {
  private db: Database.Database;
  private config: PredictorConfig;

  constructor(dbPath: string, config?: Partial<PredictorConfig>) {
    this.db = new Database(dbPath);
    this.config = {
      method: config?.method || 'linear_regression',
      forecastHorizon: config?.forecastHorizon || '24h',
      historicalWindow: config?.historicalWindow || '7d',
      updateInterval: config?.updateInterval || '1h',
      confidence: config?.confidence || 0.95,
    };
  }

  /**
   * Generate prediction for a metric
   */
  async predict(metricName: string, labels?: Record<string, string>): Promise<Prediction> {
    const historicalData = this.getHistoricalData(metricName, labels);
    const predictions = this.generatePredictions(historicalData);
    const accuracy = this.calculateAccuracy(historicalData);

    const prediction: Partial<Prediction> = {
      generatedAt: new Date(),
      metricName,
      predictionMethod: this.config.method,
      forecastHorizon: this.config.forecastHorizon,
      historicalWindow: this.config.historicalWindow,
      predictions,
      modelAccuracy: accuracy,
      labels,
      expiresAt: new Date(Date.now() + this.parseInterval(this.config.updateInterval)),
    };

    // Store prediction
    const result = this.db.prepare(`
      INSERT INTO predictions (
        generated_at, metric_name, prediction_method, forecast_horizon,
        historical_window, predictions, model_accuracy, labels, metadata, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      prediction.generatedAt!.toISOString(),
      prediction.metricName,
      prediction.predictionMethod,
      prediction.forecastHorizon,
      prediction.historicalWindow,
      JSON.stringify(prediction.predictions),
      prediction.modelAccuracy,
      prediction.labels ? JSON.stringify(prediction.labels) : null,
      null,
      prediction.expiresAt!.toISOString()
    );

    return { ...prediction, id: result.lastInsertRowid as number } as Prediction;
  }

  private getHistoricalData(metricName: string, labels?: Record<string, string>): Array<{ timestamp: Date; value: number }> {
    const windowMs = this.parseInterval(this.config.historicalWindow);
    const startTime = new Date(Date.now() - windowMs);

    const sql = `
      SELECT timestamp, metric_value as value
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp >= ?
      ORDER BY timestamp ASC
    `;

    const rows = this.db.prepare(sql).all(metricName, startTime.toISOString()) as any[];

    return rows.map(r => ({
      timestamp: new Date(r.timestamp),
      value: r.value,
    }));
  }

  private generatePredictions(historical: Array<{ timestamp: Date; value: number }>): PredictionPoint[] {
    if (historical.length < 2) {
      return [];
    }

    switch (this.config.method) {
      case 'linear_regression':
        return this.linearRegressionPredict(historical);
      case 'moving_average':
        return this.movingAveragePredict(historical);
      case 'exponential_smoothing':
        return this.exponentialSmoothingPredict(historical);
      default:
        return this.linearRegressionPredict(historical);
    }
  }

  private linearRegressionPredict(historical: Array<{ timestamp: Date; value: number }>): PredictionPoint[] {
    // Convert timestamps to numeric values (milliseconds)
    const data = historical.map((h, i) => ({ x: i, y: h.value }));

    // Calculate linear regression coefficients
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumXX = data.reduce((sum, d) => sum + d.x * d.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const forecastMs = this.parseInterval(this.config.forecastHorizon);
    const lastTimestamp = historical[historical.length - 1].timestamp;
    const intervalMs = historical.length > 1
      ? (historical[historical.length - 1].timestamp.getTime() - historical[0].timestamp.getTime()) / (historical.length - 1)
      : 3600000; // Default 1 hour

    const numPoints = Math.ceil(forecastMs / intervalMs);
    const predictions: PredictionPoint[] = [];

    for (let i = 1; i <= numPoints; i++) {
      const timestamp = new Date(lastTimestamp.getTime() + i * intervalMs);
      const value = slope * (n + i - 1) + intercept;
      const confidenceLower = value * 0.9; // Simple 90% confidence interval
      const confidenceUpper = value * 1.1;

      predictions.push({
        timestamp,
        value,
        confidenceLower,
        confidenceUpper,
      });
    }

    return predictions;
  }

  private movingAveragePredict(historical: Array<{ timestamp: Date; value: number }>): PredictionPoint[] {
    const windowSize = Math.min(10, Math.floor(historical.length / 2));
    const recent = historical.slice(-windowSize);
    const avg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;

    const forecastMs = this.parseInterval(this.config.forecastHorizon);
    const lastTimestamp = historical[historical.length - 1].timestamp;
    const intervalMs = historical.length > 1
      ? (historical[historical.length - 1].timestamp.getTime() - historical[0].timestamp.getTime()) / (historical.length - 1)
      : 3600000;

    const numPoints = Math.ceil(forecastMs / intervalMs);
    const predictions: PredictionPoint[] = [];

    for (let i = 1; i <= numPoints; i++) {
      const timestamp = new Date(lastTimestamp.getTime() + i * intervalMs);
      predictions.push({
        timestamp,
        value: avg,
        confidenceLower: avg * 0.85,
        confidenceUpper: avg * 1.15,
      });
    }

    return predictions;
  }

  private exponentialSmoothingPredict(historical: Array<{ timestamp: Date; value: number }>): PredictionPoint[] {
    const alpha = 0.3; // Smoothing factor
    let smoothed = historical[0].value;

    for (const h of historical) {
      smoothed = alpha * h.value + (1 - alpha) * smoothed;
    }

    const forecastMs = this.parseInterval(this.config.forecastHorizon);
    const lastTimestamp = historical[historical.length - 1].timestamp;
    const intervalMs = historical.length > 1
      ? (historical[historical.length - 1].timestamp.getTime() - historical[0].timestamp.getTime()) / (historical.length - 1)
      : 3600000;

    const numPoints = Math.ceil(forecastMs / intervalMs);
    const predictions: PredictionPoint[] = [];

    for (let i = 1; i <= numPoints; i++) {
      const timestamp = new Date(lastTimestamp.getTime() + i * intervalMs);
      predictions.push({
        timestamp,
        value: smoothed,
        confidenceLower: smoothed * 0.8,
        confidenceUpper: smoothed * 1.2,
      });
    }

    return predictions;
  }

  private calculateAccuracy(historical: Array<{ timestamp: Date; value: number }>): number {
    if (historical.length < 10) {
      return 0.5; // Low confidence with insufficient data
    }

    // Calculate R-squared on recent data
    const testSize = Math.floor(historical.length * 0.2);
    const train = historical.slice(0, -testSize);
    const test = historical.slice(-testSize);

    const predictions = this.linearRegressionPredict(train);
    const predicted = predictions.slice(0, testSize);

    const meanActual = test.reduce((sum, t) => sum + t.value, 0) / test.length;
    const ssTotal = test.reduce((sum, t) => sum + Math.pow(t.value - meanActual, 2), 0);
    const ssResidual = test.reduce((sum, t, i) => {
      const predictedValue = predicted[i]?.value || meanActual;
      return sum + Math.pow(t.value - predictedValue, 2);
    }, 0);

    const rSquared = 1 - (ssResidual / ssTotal);
    return Math.max(0, Math.min(1, rSquared));
  }

  private parseInterval(interval: string): number {
    const match = /^(\d+)([smhd])$/.exec(interval);
    if (!match) throw new Error(`Invalid interval: ${interval}`);

    const [, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);

    switch (unit) {
      case 's': return amount * 1000;
      case 'm': return amount * 60 * 1000;
      case 'h': return amount * 60 * 60 * 1000;
      case 'd': return amount * 24 * 60 * 60 * 1000;
      default: throw new Error(`Invalid unit: ${unit}`);
    }
  }

  close(): void {
    this.db.close();
  }
}
