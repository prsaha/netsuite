# syseng-netsuite-test

NetSuite SuiteCloud project containing business automation, data management, and compliance workflows for Fivetran's internal NetSuite instance. Built on NetSuite N/API v2.x/2.1.

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Script Modules](#script-modules)
  - [Term & Invoice Management](#1-term--invoice-management)
  - [Tax Handling](#2-tax-handling)
  - [Dunning Management](#3-dunning-management)
  - [PII Retention & Removal](#4-pii-retention--removal)
  - [Invoice PDF Generation](#5-invoice-pdf-generation)
  - [Employee Access Management](#6-employee-access-management)
  - [Data Deletion & Cleanup](#7-data-deletion--cleanup)
  - [Email & Communication](#8-email--communication)
  - [AppWrap Modules](#9-appwrap-modules)
  - [Utility Libraries](#10-utility-libraries)
  - [Celigo Integration](#11-celigo-integration)
- [Workflows](#workflows)
- [Configuration Parameters](#configuration-parameters)
- [Custom Record Types](#custom-record-types)
- [NetSuite APIs Used](#netsuite-apis-used)
- [Hardcoded Values & Test Data](#hardcoded-values--test-data)
- [Deployment](#deployment)
- [License](#license)

---

## Repository Structure

```
syseng-netsuite-test/
├── suitecloud.config.js              # SuiteCloud CLI config (defaultProjectFolder: "src")
├── LICENSE                           # GNU GPL v3
└── src/
    ├── deploy.xml                    # Deployment manifest
    ├── manifest.xml                  # Package metadata
    └── FileCabinet/SuiteScripts/
        ├── FT_CS_Term_EOM.js                          # ClientScript: 60-day EOM due date
        ├── FT_UE_Term_EOM.js                          # UserEvent: 60-day EOM (server-side)
        ├── FT_UE_Tax_Override_For_Third_Party.js      # UserEvent: Zero tax for TPP transactions
        ├── FT_MR_Send_Bulk_Email.js                   # MapReduce: Bulk templated email
        ├── FT_MR_Purge_Files_Decoupling.js            # MapReduce: File cabinet cleanup
        ├── [FT]-MR Delete Duplicate Invoices.js       # MapReduce: Remove duplicate invoices
        ├── rev_event_script.js                        # Revenue recognition event trigger
        ├── script.js                                  # Legacy: Tax code optional (NS 1.x API)
        ├── suiteql-query-tool.v20211027.suitelet.js   # Debug: SuiteQL query runner
        ├── exportSavedSearch.js                       # Utility: Export saved search results
        │
        ├── AW | Rejection Reason Customization/
        │   ├── AppWrap_WA_CallRejectSuitelet.js       # WorkflowAction: Call rejection suitelet
        │   └── SK_Comment.js                          # Comment module
        │
        ├── AppWrap/
        │   ├── In Approver Group Check/
        │   │   ├── AppWrap_UE_InApproverGroup.js      # UserEvent: Check approver group membership
        │   │   ├── AppWrap_WA_InApproverGroup.js      # WorkflowAction: Approver group check
        │   │   └── modules/AppWrap_InApproverGroup.js # Shared module
        │   ├── Send Email to Approver Group/
        │   │   ├── AppWrap_WA_SendEmailToApproverGroup.js
        │   │   └── modules/AppWrap_SendEmailToApproverGroup.js
        │   └── lib/
        │       ├── AppWrap_UtilityBelt.js             # Shared utilities
        │       └── AppWrap_ajv7_8.12.0.min.js         # JSON Schema validator (ajv 8.12.0)
        │
        ├── Edit Fields Advance/                       # AppWrap advanced field editing suite
        │   ├── AppWrap_EditFieldsAdvance_Client.js
        │   ├── AppWrap_EditFieldsAdvance_Library.js
        │   ├── AppWrap_EditFieldsAdvance_Suitelet.js
        │   ├── AppWrap_EditFieldsAdvance_WorkFlowAction.js
        │   ├── editfield_lib/UtilityBelt.js
        │   └── suitelet/
        │       ├── AppWrap_EditFieldsAdvance_BodyFields.js
        │       ├── AppWrap_EditFieldsAdvance_SublistFields.js
        │       └── AppWrap_EditFieldsAdvance_UpdateRecord.js
        │
        └── Fivetran/
            ├── Adhoc Scripts/UserEvent/
            │   └── autoRejectNcalJeUE.js              # UserEvent: Auto-reject NCAL journal entries
            ├── Decoupling/MapReduce/
            │   └── deleteDuplicateSalesOrdersMR.js    # MapReduce: CSV-driven sales order deletion
            ├── Dunning/
            │   ├── MapReduce/FT_MR_Update_Dunning_Recipients.js  # 724 lines
            │   └── UserEvent/FT_UE_Check_Sales_Rep_Update.js
            ├── Employee Access Management/
            │   ├── MapReduce/employeeAccessManagementMR.js
            │   └── Restlet/triggerEmployeeAccessJobRS.js
            ├── Invoice PDF Generator/
            │   ├── generateInvoicePDF.js
            │   └── triggerInvoicePDFjobRS.js
            ├── Retention_Schedules/
            │   ├── Config/PII_FIELDS.json
            │   ├── Client/handlePiiClientActions.js
            │   ├── Library/
            │   │   ├── piiRequestApprovalModel.js
            │   │   ├── piiRequestGlobalFunctions.js
            │   │   └── piiRequestScreenUIComp.js
            │   ├── MapReduce/
            │   │   ├── createPIIRecordMR.js           # 227 lines
            │   │   ├── approvePIIRequestRecordsMR.js
            │   │   ├── autoApproveEntityRecordMR.js
            │   │   ├── deletePIICustomRecordsMR.js
            │   │   └── reprocessRejectedPIIRecordsMR.js
            │   ├── Queries/suiteQlLib.js
            │   └── Suitelet/
            │       ├── pIIRequestApprovalScreenSL.js
            │       └── piiUnitTestSL.js
            └── Utilities/
                ├── suiteQlUtilities.js                # 265 lines — pagination & form helpers
                ├── mapReduceUtilities.js              # MapReduce error handling wrapper
                ├── generateCommonBatchid.js           # Celigo batch ID generator
                └── deleteInvoicesbyDate.js            # Bulk invoice deletion by date
```

**Stats:** 55 files · ~12,300+ lines of JavaScript · GPL v3

---

## Script Modules

### 1. Term & Invoice Management

#### `FT_CS_Term_EOM.js` — ClientScript
Auto-calculates due dates for invoices using 60-day EOM terms in the NetSuite UI.

- **Events:** `pageInit`, `fieldChanged`, `postSourcing`
- **Logic:** When term ID `14` ("60 Days EOM") is selected, computes `trandate + 60 days` then moves to the last day of that month, setting `duedate`
- **Helper:** `getLastDayOfMonth(date)` — returns last day of the following month

#### `FT_UE_Term_EOM.js` — UserEventScript
Server-side equivalent of `FT_CS_Term_EOM.js` for records created via bulk import or REST API (no UI involved).

- **Event:** `beforeSubmit`
- **Logic:** Same 60-day EOM calculation, applied server-side

---

### 2. Tax Handling

#### `FT_UE_Tax_Override_For_Third_Party.js` — UserEventScript
Auto-zeroes the tax rate on transactions flagged as third-party payer (TPP).

- **Event:** `beforeSubmit`
- **Logic:**
  - If `custbodyis_tpp_transaction = true`
  - Sets `custbody_ava_taxoverride = true`
  - Sets `taxrate = 0`
- **Use Case:** Compliance with TPP tax regulations

---

### 3. Dunning Management

#### `FT_MR_Update_Dunning_Recipients.js` — MapReduceScript (724 lines)
Automatically creates and maintains dunning recipient records when customer contacts or sales rep assignments change.

- **Trigger:** Scheduled MapReduce
- **Input:** Customer records filtered by `internalid = 860509` (test account; update for production)
- **Key Functions:**

| Function | Purpose |
|---|---|
| `removeEmailDuplicate()` | Deduplicate customer email list |
| `findExistingDunningDetails()` | Query existing dunning records via SuiteQL |
| `createCustomerContacts()` | Create contact records flagged for dunning |
| `createDunningRec()` | Link contacts to customer dunning records |
| `checkDunningForUpdate()` | Identify new/removed email addresses |
| `updateDunningRec()` | Activate or deactivate dunning recipients |
| `updateRepDunningRecepient()` | Manage sales rep dunning assignment |

- **Dunning Levels:** `1` = customer contact · `3` = sales rep
- **Error Field:** `custentity_ft_dunning_rec_aut_error` — stores exception message on the customer record
- **Script Parameters:**

| Parameter | Purpose |
|---|---|
| `custscript_ft_script_self_service` | Self-service user ID to skip |
| `custscript_ft_rep_dunning_level_id` | Dunning level ID for sales reps (default: `3`) |

#### `FT_UE_Check_Sales_Rep_Update.js` — UserEventScript
Flags a customer record when its sales rep assignment changes so the dunning MR can detect and react.

- **Event:** `beforeSubmit`
- **Logic:** Sets `custentity_ft_dunning_rep_dunning_rec_cr = true` when `salesrep` changes
- **Parameter:** `custscript_ft_self_service_rep_id` — excludes the self-service rep from triggering

---

### 4. PII Retention & Removal

Full workflow for GDPR/privacy compliance — creates, reviews, approves, and executes PII field removal on customer, employee, vendor, and contact records.

#### `PII_FIELDS.json` — Configuration
Defines which fields constitute PII per record type.

```json
{
  "customer":  [{ "id": "salesrep", "type": "select" }, { "id": "email", "type": "email" }, ...],
  "employee":  [...],
  "vendor":    [...],
  "contact":   [...]
}
```
Field types: `text`, `email`, `phone number`, `text area`, `date`, `select`, `decimal`

#### `createPIIRecordMR.js` — MapReduceScript (227 lines)
Creates PII removal request records for entities that have reached their data retention threshold.

- **Input:** Saved search of entities modified within retention period (via `custscript_ft_rs_pii_entity_ss`)
- **map:** Extracts entity ID, type, and last activity date
- **reduce:** Creates `customrecord_ft_pii_removal_req` per entity with status `Pending`
- **PII Record Fields:**

| Field | Purpose |
|---|---|
| `custrecord_ft_rs_pii_entity_internalid` | Entity internal ID |
| `custrecord_ft_rs_pii_record_type` | Record type (Employee / Customer / Vendor / Partner) |
| `custrecord_ft_rs_pii_last_activity_date` | Last transaction date |
| `custrecord_ft_rs_pii_status` | Processing status |
| `custrecord_ft_rs_pii_flds_to_rmv` | JSON array of PII fields to clear |
| `custrecord_ft_rs_pii_enty_ref_link` | Direct link to entity record |
| `custrecord_ft_pii_entity_inactive` | Flag for inactive entities |

- **Helpers:** `getNetSuiteBaseUrl()` (handles sandbox/production), `getPiiFieldsFromParam()`
- **Notification:** Sends email summary to configured recipients on completion

#### `approvePIIRequestRecordsMR.js` — MapReduceScript
Executes PII field removal for approved requests.

- **Input:** Approved entries with `{ piiEntryId, entityId, entityType, approver, action, piiFields }`
- **Actions:**
  - `approve` — Clears PII fields; select/decimal via `record.submitFields()`, all others via native `N/piremoval` API
  - `reject` — Marks record as rejected
- **Status:** Updates PII record with final state after execution

#### `autoApproveEntityRecordMR.js` — MapReduceScript
Auto-approves PII removal for inactive employees and vendors without requiring manual review.

- **Input:** Search for inactive entities with pending PII records
- **Process:** Executes field clearance automatically

#### `reprocessRejectedPIIRecordsMR.js` — MapReduceScript
Re-queues PII records that were rejected more than N days ago.

- **Input:** PII records with `status = 4 (Rejected)` and `reviewed_date > N days ago`
- **Process:** Resets status to `2 (Pending)` for another approval cycle
- **Parameter:** `custscript_pii_rejected_days` (default: `30`)

#### `deletePIICustomRecordsMR.js` — MapReduceScript
Deletes all `customrecord_ft_pii_removal_req` records. Run after retention period expires as final cleanup.

#### `pIIRequestApprovalScreenSL.js` — Suitelet
UI for the manual PII review and approval workflow.

- **GET:** Renders approval form listing pending PII records (via `piiRequestApprovalModel`)
- **POST:** Processes bulk approve/reject actions

#### `handlePiiClientActions.js` — ClientScript
Client-side form logic for the PII approval screen.

- **Events:** `pageInit`, `markAllApprovalHandler`, `unmarkAllApprovalHandler`
- **Sublist ID:** `custpage_pii_sublist`
- **Functions:** `setAllMarks(mark, fieldId)`, `getParameterFromURL(param)`

#### Library Modules
| File | Purpose |
|---|---|
| `piiRequestApprovalModel.js` | Model class wrapping the approval workflow |
| `piiRequestGlobalFunctions.js` | Shared utility functions |
| `piiRequestScreenUIComp.js` | UI component builder for the approval screen |
| `suiteQlLib.js` | SuiteQL paginated query wrapper (5,000 records/page) |
| `piiUnitTestSL.js` | Unit test suitelet for PII workflow debugging |

---

### 5. Invoice PDF Generation

#### `triggerInvoicePDFjobRS.js` — Restlet (100+ lines)
HTTP trigger to submit and monitor the invoice PDF generation MapReduce job.

- **GET** — Submits the MapReduce task:
  ```json
  {
    "success": true,
    "message": "Invoice PDF Generation script triggered successfully.",
    "taskId": "MAPREDUCETASK_...",
    "timeStamp": "2025-02-21T17:36:39.143Z"
  }
  ```
- **POST** — Poll job status and retrieve generated files (`{ "taskId": "..." }`):
  ```json
  {
    "success": true,
    "status": "COMPLETE",
    "files": [
      {
        "rownumber": 1,
        "id": 2856923,
        "name": "INV23112430044.pdf",
        "url": "/core/media/media.nl?id=2856923&c=...",
        "fullUrl": "https://5260239-sb1.app.netsuite.com/..."
      }
    ]
  }
  ```
- **Script/Deployment IDs:** `customscript_ft_mr_inv_pdf_gen` / `customdeploy_mr_inv_pdf_gen`
- **Parameter:** `custscript_ft_sp_dec_staged` — Staging folder ID for PDFs

#### `generateInvoicePDF.js` — MapReduceScript (80+ lines)
Renders invoice records as PDFs and stores them in the file cabinet.

- **Input:** Saved search of invoices (via `custscript_ft_sp_inv_pdf_gen_ss`)
- **map:** Renders each invoice against a configured PDF template
- **reduce:** Saves rendered PDF to the designated file cabinet folder
- **File Naming:** Based on invoice `tranid` (document number)
- **Helper:** `fileExists(folderId, fileName)` — prevents duplicate generation
- **Parameters:**

| Parameter | Purpose |
|---|---|
| `custscript_ft_sp_inv_pdf_gen_ss` | Saved search ID for invoices |
| `custscript_ft_sp_inv_pdf_tmpl_id` | PDF template ID |
| `custscript_ft_sp_staged` | File cabinet destination folder ID |
| `custscript_ft_sp_email_author_id` | Notification email author user ID |
| `custscript_ft_sp_recipients` | Comma-separated notification recipients |

---

### 6. Employee Access Management

#### `employeeAccessManagementMR.js` — MapReduceScript
Automates employee access control workflows in NetSuite.

#### `triggerEmployeeAccessJobRS.js` — Restlet
HTTP endpoint to initiate the employee access management MapReduce job.

---

### 7. Data Deletion & Cleanup

#### `deleteDuplicateSalesOrdersMR.js` — MapReduceScript
CSV-driven bulk deletion of duplicate sales orders.

- **Input:** CSV file in file cabinet (internal IDs in first column)
- **getInputData:** Parses CSV, extracts sales order IDs
- **map:** Deletes each sales order by ID
- **summarize:** Logs deletion results and errors
- **Parameter:** `custscript_sp_csv_file_id` — File cabinet ID of the CSV

#### `deleteInvoicesbyDate.js`
Bulk delete invoices within a specified date range.

#### `FT_MR_Purge_Files_Decoupling.js` — MapReduceScript
Purges file cabinet items associated with the decoupling process.

#### `[FT]-MR Delete Duplicate Invoices.js` — MapReduceScript
Removes duplicate invoice records.

---

### 8. Email & Communication

#### `FT_MR_Send_Bulk_Email.js` — MapReduceScript
Sends merged templated emails to a list of customers.

- **reduce:** Merges template `116` with each customer's entity context
- **CC:** Pulled from `addEmail` field per record
- **Input:** Hardcoded customer data (test: customer ID `540025`); replace with a saved search for production use
- **Dependencies:** `N/email`, `N/render`

---

### 9. AppWrap Modules

Third-party modules from AppWrap Inc. (© 2024) for approval group management and advanced field editing.

#### Approver Group Check
| File | Type | Purpose |
|---|---|---|
| `AppWrap_UE_InApproverGroup.js` | UserEventScript | Sets a flag if the current user is in the approver group (`afterSubmit`) |
| `AppWrap_WA_InApproverGroup.js` | WorkflowAction | Workflow-triggered variant of the approver check |
| `AppWrap_InApproverGroup.js` | Library | Shared approver group lookup logic |
| `AppWrap_SendEmailToApproverGroup.js` | Library | Email notifications to the approver group |

#### Edit Fields Advance Suite (7 files)
Advanced UI for editing body and sublist fields on any NetSuite record type.

| File | Purpose |
|---|---|
| `AppWrap_EditFieldsAdvance_Client.js` | Client-side form event handlers |
| `AppWrap_EditFieldsAdvance_Library.js` | Core utilities — search, pagination, form building |
| `AppWrap_EditFieldsAdvance_Suitelet.js` | UI rendering entry point |
| `AppWrap_EditFieldsAdvance_WorkFlowAction.js` | Workflow integration |
| `AppWrap_EditFieldsAdvance_BodyFields.js` | Body-level field management |
| `AppWrap_EditFieldsAdvance_SublistFields.js` | Sublist column management |
| `AppWrap_EditFieldsAdvance_UpdateRecord.js` | Persists field changes to records |

- **Dependencies:** `AppWrap_UtilityBelt.js`, `AppWrap_ajv7_8.12.0.min.js` (JSON Schema validator)

#### Rejection Reason Customization
| File | Purpose |
|---|---|
| `AppWrap_WA_CallRejectSuitelet.js` | WorkflowAction invoking the rejection suitelet |
| `SK_Comment.js` | Comment display module |

---

### 10. Utility Libraries

#### `suiteQlUtilities.js` — Library (265 lines)
General-purpose SuiteQL and form utilities, used across multiple modules.

| Function | Purpose |
|---|---|
| `runQuery({ sql, limit, pageSize, queryName })` | ROWNUM-based paginated SuiteQL (legacy method) |
| `queryFetch({ sql })` | Native `runSuiteQLPaged()` pagination (preferred) |
| `runPagedQuery(sql, pageSize)` | Returns raw paged query object |
| `addSubTabs(form, subtabs)` | Add tabs to a Suitelet form |
| `addButtons(form, buttons)` | Add buttons to a Suitelet form |
| `addFields(form, fields)` | Add fields with full UI property configuration |
| `addSublists(form, sublists)` | Add sublists with fields and buttons |
| `setFieldProperties(field, obj)` | Set mandatory, displayType, and other UI props |
| `isEmpty(checkVar)` | Null/undefined/empty string check |
| `isNullOrEmptyObject(obj)` | Object emptiness check |

- **Page sizes:** 1,000–5,000 records per page

#### `mapReduceUtilities.js` — Library (37 lines)
Standardised error extraction for MapReduce `summarize()` phases.

| Function | Purpose |
|---|---|
| `inputSummary(summaryContext)` | Extract input phase errors |
| `mapSummary(summaryContext)` | Iterate map phase errors |
| `reduceSummary(summaryContext)` | Iterate reduce phase errors |

#### `autoRejectNcalJeUE.js` — UserEventScript
Auto-rejects NCAL (non-calendar) journal entries on `beforeSubmit`.

#### `script.js` — Legacy (7 lines)
Deprecated NetSuite 1.x script. Makes the tax code field optional via `nlapiGetLineItemField`. Do not use in new development.

---

### 11. Celigo Integration

#### `generateCommonBatchid.js`
Generates batch IDs for Celigo integration flows. Runs as a `preSavePage` hook in the Celigo pipeline.

- **Logic:**
  - Generates a 10-digit random numeric string
  - Prefixes with `"Celigo_"` (e.g., `Celigo_4827361950`)
  - Injects the batch ID into each transaction record in the payload
  - Returns transformed data with checksum
- **Use Case:** Batch deduplication and traceability in Celigo → NetSuite ERP flows

---

## Workflows

### Dunning Recipient Automation
```
Customer email or salesrep changes
  → FT_UE_Check_Sales_Rep_Update sets custentity_ft_dunning_rep_dunning_rec_cr = true
  → FT_MR_Update_Dunning_Recipients (scheduled):
      → Query existing dunning records
      → Create/update contact records
      → Create/update customrecord_3805_dunning_recipient records
      → Activate new emails / deactivate removed emails
      → Update customer error field on failure
```

### PII Removal Workflow
```
Entity reaches data retention threshold
  → createPIIRecordMR creates customrecord_ft_pii_removal_req (status: Pending)
  → pIIRequestApprovalScreenSL renders review UI
  → Reviewer approves or rejects via handlePiiClientActions
  → approvePIIRequestRecordsMR executes field clearance:
      select/decimal fields → record.submitFields()
      all other PII fields  → N/piremoval API
  → Inactive entities → autoApproveEntityRecordMR (no manual review needed)
  → reprocessRejectedPIIRecordsMR re-queues rejections after 30 days
  → deletePIICustomRecordsMR cleans up records after retention expires
```

### Invoice PDF Generation
```
Caller → GET /triggerInvoicePDFjobRS
  → Submits generateInvoicePDF MapReduce task
  → Returns { taskId }

Caller → POST /triggerInvoicePDFjobRS { taskId }
  → Checks job status
  → On COMPLETE: returns list of generated PDF files with cabinet URLs
```

### Sales Rep Dunning Update
```
Customer salesrep field changes
  → FT_UE_Check_Sales_Rep_Update flags customer record
  → FT_MR_Update_Dunning_Recipients (next scheduled run):
      → Detects flag
      → Creates or updates sales rep dunning recipient (level 3)
```

---

## Configuration Parameters

| Parameter ID | Script | Purpose | Default |
|---|---|---|---|
| `custscript_pii_rejected_days` | reprocessRejectedPIIRecordsMR | Days before re-queuing rejected PII records | `30` |
| `custscript_ft_rs_pii_entity_ss` | createPIIRecordMR | Saved search ID for PII entity selection | — |
| `custscript_sp_pii_removal_fields` | createPIIRecordMR | JSON config of PII fields per record type | — |
| `custscript_ft_sp_email_author_id` | createPIIRecordMR | Author user ID for notification emails | — |
| `custscript_ft_sp_recipients` | createPIIRecordMR | Comma-separated notification recipients | — |
| `custscript_ft_self_service_rep_id` | FT_UE_Check_Sales_Rep_Update | Self-service rep ID to exclude from dunning | — |
| `custscript_ft_script_self_service` | FT_MR_Update_Dunning_Recipients | Self-service user to skip in dunning MR | — |
| `custscript_ft_rep_dunning_level_id` | FT_MR_Update_Dunning_Recipients | Dunning level ID for sales reps | `3` |
| `custscript_ft_sp_inv_pdf_gen_ss` | generateInvoicePDF | Saved search ID for invoices to process | — |
| `custscript_ft_sp_inv_pdf_tmpl_id` | generateInvoicePDF | Invoice PDF template ID | — |
| `custscript_ft_sp_staged` | generateInvoicePDF | File cabinet folder ID for generated PDFs | — |
| `custscript_ft_sp_dec_staged` | triggerInvoicePDFjobRS | Staging folder ID | — |
| `custscript_sp_csv_file_id` | deleteDuplicateSalesOrdersMR | CSV file ID containing sales order IDs to delete | — |

---

## Custom Record Types

| Record Type ID | Purpose | Key Fields |
|---|---|---|
| `customrecord_ft_pii_removal_req` | PII removal request tracking | `custrecord_ft_rs_pii_entity_internalid`, `custrecord_ft_rs_pii_record_type`, `custrecord_ft_rs_pii_status`, `custrecord_ft_rs_pii_flds_to_rmv`, `custrecord_ft_rs_pii_last_activity_date`, `custrecord_ft_rs_pii_enty_ref_link`, `custrecord_ft_pii_entity_inactive` |
| `customrecord_3805_dunning_recipient` | Dunning recipient junction record | `custrecord_3805_dunning_recipient_cust`, `custrecord_3805_dunning_recipient_cont`, `custrecord_dl_dunning_level_recipients` |

---

## NetSuite APIs Used

| API | Usage |
|---|---|
| `N/record` | Record CRUD — load, create, save, submitFields, delete |
| `N/search` | Saved search loading and ad-hoc searches |
| `N/query` | SuiteQL execution via `runSuiteQL` / `runSuiteQLPaged` |
| `N/email` | Send transactional and bulk emails |
| `N/render` | Template merging for PDF generation |
| `N/file` | File cabinet read/write/delete |
| `N/task` | MapReduce task submission and status polling |
| `N/url` | Dynamic URL construction |
| `N/runtime` | Script parameters, environment info (sandbox vs prod) |
| `N/format` | Date and number formatting |
| `N/error` | Structured error object creation |
| `N/piremoval` | Native PII field removal (GDPR compliance) |
| `N/https` | Outbound HTTP requests |
| `N/ui/message` | Form notification messages |
| `N/currentRecord` | Client-side record context |
| `N/log` | debug / audit / error logging |

---

## Hardcoded Values & Test Data

> These values are present in scripts and should be reviewed before running in production.

| Value | Script | Note |
|---|---|---|
| Term ID `14` | `FT_CS_Term_EOM.js`, `FT_UE_Term_EOM.js` | "60 Days EOM" payment term internal ID |
| Template ID `116` | `FT_MR_Send_Bulk_Email.js` | Customer email merge template |
| Customer ID `540025` | `FT_MR_Send_Bulk_Email.js` | Test customer — replace with saved search |
| Customer ID `860509` | `FT_MR_Update_Dunning_Recipients.js` | Hardcoded test account filter — remove for production |
| Dunning Level `1` | `FT_MR_Update_Dunning_Recipients.js` | Customer contact dunning level |
| Dunning Level `3` | `FT_MR_Update_Dunning_Recipients.js` | Sales rep dunning level |
| Batch prefix `"Celigo_"` | `generateCommonBatchid.js` | Celigo batch ID format |

---

## Deployment

### Prerequisites
- Node.js + SuiteCloud CLI (`@oracle/suitecloud-cli`)
- NetSuite account credentials configured

### Setup
```bash
npm install -g @oracle/suitecloud-cli
suitecloud account:setup
```

### Deploy to NetSuite
```bash
suitecloud project:deploy
```

The deployment manifest (`src/deploy.xml`) includes:
- `~/AccountConfiguration/*`
- `~/FileCabinet/*` — all SuiteScripts
- `~/Objects/*` — script deployment records
- `~/Translations/*`

### Project Configuration (`suitecloud.config.js`)
```js
module.exports = {
  defaultProjectFolder: 'src',
  commands: {}
};
```

---

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE) for full text.

**Third-party:** AppWrap modules (`AppWrap_*.js`) are © 2024 AppWrap, Inc. and subject to their own license terms. See individual files for disclaimer.
