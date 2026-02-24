/**
 * Azure Function: paylocity-sync
 * Timer trigger (daily at 2:00 AM UTC) that pulls time entries from Paylocity API,
 * reconciles with Dataverse TimeEntries, and flags discrepancies.
 *
 * Schedule: 0 0 2 * * * (daily at 2:00 AM)
 */

const fetch = require("node-fetch");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

// ── Constants ───────────────────────────────────────────────────────────────

const PAYLOCITY_BASE_URL = "https://api.paylocity.com/api/v2";
const DISCREPANCY_THRESHOLD_HOURS = 0.25; // Flag if difference > 15 minutes

// ── Paylocity Client ────────────────────────────────────────────────────────

class PaylocityClient {
  constructor(apiKey, companyId) {
    this.apiKey = apiKey;
    this.companyId = companyId;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return;
    }

    const response = await fetch(`${PAYLOCITY_BASE_URL}/companies/${this.companyId}/openapi/security/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(this.apiKey).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Paylocity auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  }

  async getTimeEntries(startDate, endDate) {
    await this.authenticate();

    const response = await fetch(
      `${PAYLOCITY_BASE_URL}/companies/${this.companyId}/employees/timeentries?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Paylocity time entries fetch failed: ${response.status}`);
    }

    return response.json();
  }

  async getEmployees() {
    await this.authenticate();

    const response = await fetch(
      `${PAYLOCITY_BASE_URL}/companies/${this.companyId}/employees?statusfilter=Active`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Paylocity employees fetch failed: ${response.status}`);
    }

    return response.json();
  }
}

// ── Dataverse Client ────────────────────────────────────────────────────────

class DataverseClient {
  constructor(environmentUrl) {
    this.baseUrl = `${environmentUrl}/api/data/v9.2`;
    this.credential = new DefaultAzureCredential();
  }

  async getToken() {
    const envUrl = this.baseUrl.split("/api")[0];
    const tokenResponse = await this.credential.getToken(`${envUrl}/.default`);
    return tokenResponse.token;
  }

  async getTimeEntries(startDate, endDate) {
    const token = await this.getToken();
    const filter = `tvs_date ge ${startDate} and tvs_date le ${endDate}`;
    const url = `${this.baseUrl}/tvs_timeentries?$filter=${encodeURIComponent(filter)}&$expand=tvs_userid($select=internalemailaddress,fullname)&$orderby=tvs_date asc`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Dataverse time entries fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data.value;
  }

  async updateTimeEntry(entryId, data) {
    const token = await this.getToken();

    const response = await fetch(
      `${this.baseUrl}/tvs_timeentries(${entryId})`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Dataverse update failed for ${entryId}: ${response.status}`);
    }
  }

  async logAutomation(data) {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}/tvs_automationlogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
      },
      body: JSON.stringify({
        tvs_flowname: "paylocity-sync",
        tvs_triggertype: 100000000, // Scheduled
        tvs_executedat: new Date().toISOString(),
        ...data,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Automation log failed: ${response.status} - ${errorBody}`);
    }
  }
}

// ── Reconciliation Logic ────────────────────────────────────────────────────

function reconcileEntries(dvEntries, paylocityEntries, employeeMap) {
  const results = {
    matched: 0,
    discrepancies: [],
    paylocityOnly: [],
    dataverseOnly: [],
  };

  // Build Paylocity lookup: employeeId + date -> hours
  const paylocityLookup = new Map();
  for (const entry of paylocityEntries) {
    const key = `${entry.employeeId}_${entry.date}`;
    const existing = paylocityLookup.get(key) || 0;
    paylocityLookup.set(key, existing + (entry.hours || 0));
  }

  // Build Dataverse lookup: email + date -> { hours, entryId }
  const dvLookup = new Map();
  for (const entry of dvEntries) {
    const email = entry.tvs_userid?.internalemailaddress || "unknown";
    const dateStr = entry.tvs_date?.split("T")[0] || "";
    const key = `${email}_${dateStr}`;
    const existing = dvLookup.get(key) || { hours: 0, entries: [] };
    existing.hours += entry.tvs_hours || 0;
    existing.entries.push(entry);
    dvLookup.set(key, existing);
  }

  // Compare: match Paylocity entries to Dataverse entries via employee email
  const processedDvKeys = new Set();

  for (const [payKey, payHours] of paylocityLookup.entries()) {
    const [employeeId, date] = payKey.split("_");
    const employee = employeeMap.get(employeeId);
    if (!employee) continue;

    const dvKey = `${employee.email}_${date}`;
    const dvData = dvLookup.get(dvKey);
    processedDvKeys.add(dvKey);

    if (!dvData) {
      results.paylocityOnly.push({
        employeeId,
        employeeName: employee.name,
        date,
        paylocityHours: payHours,
      });
      continue;
    }

    const diff = Math.abs(dvData.hours - payHours);
    if (diff <= DISCREPANCY_THRESHOLD_HOURS) {
      results.matched++;
    } else {
      results.discrepancies.push({
        employeeId,
        employeeName: employee.name,
        date,
        dataverseHours: dvData.hours,
        paylocityHours: payHours,
        differenceHours: Math.round(diff * 100) / 100,
        dvEntryIds: dvData.entries.map((e) => e.tvs_timeentryid),
      });
    }
  }

  // Find Dataverse-only entries
  for (const [dvKey, dvData] of dvLookup.entries()) {
    if (!processedDvKeys.has(dvKey)) {
      const [email, date] = dvKey.split("_");
      results.dataverseOnly.push({
        email,
        date,
        dataverseHours: dvData.hours,
        entryIds: dvData.entries.map((e) => e.tvs_timeentryid),
      });
    }
  }

  return results;
}

// ── Main Function ───────────────────────────────────────────────────────────

module.exports = async function (context, myTimer) {
  const startTime = Date.now();
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log("Timer function is running late.");
  }

  context.log(`Paylocity sync started at ${timeStamp}`);

  try {
    // Initialize clients
    const credential = new DefaultAzureCredential();
    const kvName = process.env.KEY_VAULT_NAME || "kv-tvs-holdings-dev";
    const kvUrl = `https://${kvName}.vault.azure.net`;
    const kvClient = new SecretClient(kvUrl, credential);

    const paylocityApiKey = await kvClient.getSecret("PAYLOCITY-API-KEY");
    const companyId = process.env.PAYLOCITY_COMPANY_ID || "TVS001";

    const paylocity = new PaylocityClient(paylocityApiKey.value, companyId);
    const dataverseUrl =
      process.env.DATAVERSE_TVS_URL || "https://org-tvs-dev.crm.dynamics.com";
    const dv = new DataverseClient(dataverseUrl);

    // Calculate date range (yesterday, for daily reconciliation)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split("T")[0];
    const endDate = startDate;

    context.log(`Reconciling time entries for ${startDate}`);

    // Fetch data from both sources
    const [paylocityEntries, dvEntries, employees] = await Promise.all([
      paylocity.getTimeEntries(startDate, endDate),
      dv.getTimeEntries(startDate, endDate),
      paylocity.getEmployees(),
    ]);

    context.log(
      `Fetched: ${paylocityEntries.length} Paylocity entries, ${dvEntries.length} Dataverse entries, ${employees.length} employees`
    );

    // Build employee lookup
    const employeeMap = new Map();
    for (const emp of employees) {
      employeeMap.set(emp.employeeId, {
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.workEmail || emp.personalEmail,
      });
    }

    // Reconcile
    const results = reconcileEntries(dvEntries, paylocityEntries, employeeMap);

    // Flag discrepancies in Dataverse
    let flaggedCount = 0;
    for (const discrepancy of results.discrepancies) {
      for (const entryId of discrepancy.dvEntryIds) {
        try {
          await dv.updateTimeEntry(entryId, {
            tvs_paylocitysynced: true,
            tvs_paylocitydiscrepancy: true,
          });
          flaggedCount++;
        } catch (err) {
          context.log.warn(`Failed to flag entry ${entryId}: ${err.message}`);
        }
      }
    }

    // Mark matched entries as synced
    for (const dvEntry of dvEntries) {
      const email = dvEntry.tvs_userid?.internalemailaddress;
      const date = dvEntry.tvs_date?.split("T")[0];
      const isDiscrepancy = results.discrepancies.some(
        (d) => d.dvEntryIds.includes(dvEntry.tvs_timeentryid)
      );

      if (!isDiscrepancy) {
        try {
          await dv.updateTimeEntry(dvEntry.tvs_timeentryid, {
            tvs_paylocitysynced: true,
            tvs_paylocitydiscrepancy: false,
          });
        } catch (err) {
          context.log.warn(
            `Failed to mark entry ${dvEntry.tvs_timeentryid} as synced: ${err.message}`
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log automation result
    const summaryPayload = {
      date: startDate,
      paylocityEntries: paylocityEntries.length,
      dataverseEntries: dvEntries.length,
      matched: results.matched,
      discrepancies: results.discrepancies.length,
      paylocityOnly: results.paylocityOnly.length,
      dataverseOnly: results.dataverseOnly.length,
      flaggedInDataverse: flaggedCount,
    };

    const hasIssues =
      results.discrepancies.length > 0 ||
      results.paylocityOnly.length > 0 ||
      results.dataverseOnly.length > 0;

    await dv.logAutomation({
      tvs_status: hasIssues ? 100000002 : 100000000, // Partial or Success
      tvs_duration: duration,
      tvs_outputpayload: JSON.stringify({
        summary: summaryPayload,
        discrepancies: results.discrepancies,
        paylocityOnly: results.paylocityOnly,
        dataverseOnly: results.dataverseOnly,
      }),
      tvs_correlationid: `paylocity-sync-${startDate}`,
    });

    context.log(`Paylocity sync completed in ${duration}ms`);
    context.log(`Results: ${JSON.stringify(summaryPayload)}`);
  } catch (error) {
    context.log.error(`Paylocity sync failed: ${error.message}`);
    context.log.error(error.stack);

    // Attempt to log failure
    try {
      const dataverseUrl =
        process.env.DATAVERSE_TVS_URL || "https://org-tvs-dev.crm.dynamics.com";
      const dv = new DataverseClient(dataverseUrl);
      await dv.logAutomation({
        tvs_status: 100000001, // Failed
        tvs_duration: Date.now() - startTime,
        tvs_error: error.message,
      });
    } catch (logError) {
      context.log.error(`Failed to log automation error: ${logError.message}`);
    }

    throw error; // Re-throw for Azure Functions retry logic
  }
};
