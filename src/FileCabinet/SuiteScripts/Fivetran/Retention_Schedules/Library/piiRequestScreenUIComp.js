define([
  "N/url",
  "N/query",
  "N/record",
  "N/runtime",
  "N/ui/serverWidget",
  "SuiteScripts/Fivetran/Retention_Schedules/Library/piiRequestGlobalFunctions",
  "SuiteScripts/Fivetran/Retention_Schedules/Queries/suiteQlLib",
], /**
 * @param url
 * @param{query} query
 * @param{record} record
 * @param{serverWidget} serverWidget
 * @param globals
 */ (url, query, record, runtime, serverWidget, globals, suiteQLLib) => {
    class UIComponent {
      constructor(scriptContext) {
        this.context = scriptContext;
        this.PAGE_SIZE = 50;
        this.CLIENT_SCRIPT_FILE_ID = 3408223;
      }

      // Format date to MM/DD/YYYY
      formatDateToMMDDYYYY(dateStr) {
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }

      /** Builds the pii review request form with fields, sublists, tabs etc..... */
      buildPiiRequestReviewForm = () => {
        const functionName = "buildPiiRequestReviewForm";
        let processStr = "";
        let self = this;

        try {
          // Get the filter parameters from the URL
          const params = this.context.request.parameters;
          let pageId = parseInt(params.page);

          log.debug('pageId', pageId);

          //log.debug("params", params);

          let { script: scriptId, deploy: deploymentId } = params;

          // Utilize server widget components and build the custom bulk transactions page.
          let piiReviewRequestEntryForm = serverWidget.createForm({
            title: "PII Request Bulk Approval",
          });

          // Attach client script to the form for pagination and button actions
          piiReviewRequestEntryForm.clientScriptFileId = this.CLIENT_SCRIPT_FILE_ID;

          // Get the paycorTimeEntry form definitions
          let formDefinition = this.createFormDefinitions();

          // Add subtabs to the form
          globals.addSubTabs(
            piiReviewRequestEntryForm,
            this.createFormDefinitions().subtabs
          );

          // Add fields to the form
          globals.addFields(piiReviewRequestEntryForm, formDefinition.fields);

          // Add sublists to the form
          let customSublist = globals.addSublists(
            piiReviewRequestEntryForm,
            formDefinition.sublists
          );


          let submitButton = formDefinition.submitButton;

          piiReviewRequestEntryForm.addSubmitButton(
            { id: submitButton.id, label: submitButton.label },
            true
          );

          // Check If user submitted the form by passing valid filters
          let eventListener = this.formSubmitListener(params);

          // log.debug("eventListener", eventListener);

          if (eventListener) {
            // Add defaultValues only If the URL contains the filters
            self.addDefaultValues(piiReviewRequestEntryForm, params);

            // Get the PII information entries which are in the pending state
            let piiEntriesSql = suiteQLLib.sqlModule(
              "GET_PII_INFO"
            );

            const revApproverRole = runtime.getCurrentScript().getParameter({
              name: 'custscript_rev_approver_role'
            });
            const controllerRole = runtime.getCurrentScript().getParameter({
              name: 'custscript_controller_role'
            });
            const adminRole = runtime.getCurrentScript().getParameter({
              name: 'custscript_admin_role'
            });

            const currentUser = runtime.getCurrentUser();
            const userRoleId = currentUser.role;

            // Role → allowed record types
            const roleFilters = {};
            roleFilters[revApproverRole] = `('Customer', 'Partner')`;
            roleFilters[controllerRole] = `('Vendor', 'Employee')`;

            if (roleFilters[userRoleId]) {
              piiEntriesSql += ` AND BUILTIN.DF(pii_req.custrecord_ft_rs_pii_record_type) IN ${roleFilters[userRoleId]} `;
              
              // If user is controller role, exclude inactive entities
              if (userRoleId == controllerRole) {
                piiEntriesSql += ` AND pii_req.custrecord_ft_pii_entity_inactive = 'F' `;
              }

            } else if (userRoleId != adminRole) {
              // Block everyone else
              piiEntriesSql += ` AND 1=0 `;
            }

            let pageSize = this.PAGE_SIZE;

            // Log the initial query
            log.debug("Initial piiEntriesSql", piiEntriesSql);



            if (params) {
              const { recType, entity } = params;

              // Add filters for other fields
              if (recType) {
                piiEntriesSql += ` AND pii_req.custrecord_ft_rs_pii_record_type  = '${recType}'`;
              }
              if (entity) {
                piiEntriesSql += ` AND pii_req.custrecord_ft_rs_pii_record_entity = '${entity}'`;
              }

            }
            // SQL Object to run the query
            const sqlObj = {
              sql: piiEntriesSql,
              limit: "",
              pageSize: "",
              queryName: "GET_PII_INFO",
            };

            //  log.debug("pageSize", pageSize);

            let resultSet = globals.runPagedQuery(piiEntriesSql, pageSize);
            let resultCount = resultSet.count;

            log.debug('resultCount', resultCount);

            // Retrieve the query results using an iterator
            let iterator = resultSet.iterator();
            iterator.each(function (result) {
              let page = result.value;
              return true;
            });

            if (resultCount > 0) {
              // Add custom buttons
              globals.addButtons(piiReviewRequestEntryForm, formDefinition.buttons);
            }
            // If no SQL results were found then just show the empty form.
            if (resultCount === 0) {
              this.context.response.writePage(piiReviewRequestEntryForm);
              return;
            }

            let pageCount = Math.ceil(resultCount / pageSize);
            let current_page_Id = this.getPageId(pageId, pageCount);

            // Add Prev and Next buttons to control the set of paginated results
            let paginationObject = {
              pageId: current_page_Id,
              pageCount: pageCount,
              pageSize: pageSize,
              scriptId: scriptId,
              deploymentId: deploymentId,
              piiReviewRequestEntryForm: piiReviewRequestEntryForm,
            };
            // Create Prev and Next buttons and page index widget
            self.addPaginationWidgets(paginationObject);

            // Get subset of data to be shown on page
            let addResults = self.fetchTransactionData(
              resultSet,
              current_page_Id
            );

            // Set data returned to columns in the UI
            self.addColumnsToSublist(addResults, customSublist);
          }
          // write response to the page
          this.context.response.writePage(piiReviewRequestEntryForm);
        } catch (ex) {
          let errorStr =
            ex.name != null
              ? `${ex.name}</br>${ex.message}</br>${ex.stack}</br>`
              : ex.toString();
          log.error(
            "Error",
            `A problem occured whilst ${processStr}: <br>${errorStr}<br>functionName>>>>${functionName}`
          );
        }
      };



      /**
       * Return current page ID
       * @param {number} pageId
       * @param {number} pageCount
       * @returns {number} pageId
       */
      getPageId = (pageId, pageCount) => {
        const functionName = "getPageId";
        let processStr = "";
        let self = this;
        let id = 0;

        try {
          // Set pageId to correct value if out of index
          if (!pageId || pageId == "" || pageId < 0) return id;
          else if (pageId >= pageCount) return pageCount - 1;
          else if (pageId > 0) return pageId;
        } catch (ex) {
          let errorStr =
            ex.name != null
              ? ex.name + "</br>" + ex.message + "</br>" + ex.stack + "</br>"
              : ex.toString();
          log.error(
            "Error",
            `A problem occured whilst ${processStr}: <br>${errorStr}<br>functionName>>>>${functionName}`
          );
        }
      };

      /**
       * Fetch the paginated transaction results
       * @param {object} paginateObject
       * @returns {*[]}
       */
      addPaginationWidgets = ({
        pageId,
        pageCount,
        pageSize,
        scriptId,
        deploymentId,
        piiReviewRequestEntryForm,
      }) => {
        // Add buttons to simulate Next & Previous
        // if (pageId !== 0) {
        //   piiReviewRequestEntryForm.addButton({
        //         id : 'custpage_previous',
        //         label : 'Previous',
        //         functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')'
        //     });
        // }

        // if (pageId !== pageCount - 1) {
        //   piiReviewRequestEntryForm.addButton({
        //         id : 'custpage_next',
        //         label : 'Next',
        //         functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
        //     });
        // }

        // Add drop-down and options to navigate to specific page
        let selectOptions = piiReviewRequestEntryForm.addField({
          id: "custpage_pageid",
          label: "Page",
          type: serverWidget.FieldType.SELECT,
        });

        for (let i = 0; i < pageCount; i++) {
          if (i == pageId) {
            selectOptions.addSelectOption({
              value: "pageid_" + i,
              text: i * pageSize + 1 + " - " + (i + 1) * pageSize,
              isSelected: true,
            });
          } else {
            selectOptions.addSelectOption({
              value: "pageid_" + i,
              text: i * pageSize + 1 + " - " + (i + 1) * pageSize,
            });
          }
        }
      };

      /**
       * This function creates a formDefinition object which contains fields, sublist, buttons, etc. and will be used
       * by formBuilder module to create the page.
       */
      createFormDefinitions = () => {
        let names = "PII Request Bulk Approval";
        let SELECT_TX_TAB_ID = "custpage_subtab";

        return {
          title: names,
          buttons: [
            {
              id: "approvepiientries",
              label: "Approve PII Entries",
              functionName: "approvePIIEntries();",
            },
            {
              id: "rejectpiientries",
              label: "Reject PII Entries",
              functionName: "rejectPIIEntries();",
            },
            {
              id: "status",
              label: "Status",
              functionName: "checkStatus();",
            },
          ],
          fields: [
            {
              id: "custpage_pii_rec_type_filter",
              type: serverWidget.FieldType.SELECT,
              label: "Record Type",
              source: "customlist_pii_rec_types"
            },
            {
              id: "custpage_pii_entity_filter",
              type: serverWidget.FieldType.SELECT,
              label: "Entity",
              source: "entity",
              displayType: serverWidget.FieldDisplayType.HIDDEN
            },
            {
              id: "custpage_pii_action",
              type: serverWidget.FieldType.TEXT,
              label: "Action",
              displayType: serverWidget.FieldDisplayType.HIDDEN,
            },
            {
              id: "custpage_pii_approvedby",
              type: serverWidget.FieldType.TEXT,
              label: "Approved By",
              displayType: serverWidget.FieldDisplayType.HIDDEN,
            },
            {
              id: "custpage_pii_rejectby",
              type: serverWidget.FieldType.TEXT,
              label: "Reject By",
              displayType: serverWidget.FieldDisplayType.HIDDEN,
            },
          ],
          subtabs: [
            {
              id: SELECT_TX_TAB_ID,
              label: "Select PII Entries",
            },
          ],
          submitButton: {
            id: "applyFilter",
            label: "Apply Filter",
          },
          sublists: [
            {
              id: "custpage_pii_sublist",
              label: "Select Transactions",
              type: serverWidget.SublistType.LIST,
              tab: SELECT_TX_TAB_ID,
              //markAll : true,
              buttons: [
                {
                  id: "custpage_pii_markall_approval",
                  label: "Mark All",
                  functionName: "markAllApprovalHandler",
                },
                {
                  id: "custpage_pii_unmarkall_approval",
                  label: "Unmark All",
                  functionName: "unmarkAllApprovalHandler",
                },
              ],
              fields: [
                {
                  id: "custpage_approve",
                  type: serverWidget.FieldType.CHECKBOX,
                  label: "Approve"
                },
                {
                  id: "custpage_pii_entity",
                  type: serverWidget.FieldType.TEXT,
                  label: "Entity"
                },
                {
                  id: "custpage_pii_entity_type",
                  type: serverWidget.FieldType.TEXT,
                  label: "Entity Type"
                },
                {
                  id: "custpage_internalid",
                  type: serverWidget.FieldType.INTEGER,
                  label: "internalid",
                  displayType: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                  id: "custpage_pii_last_activity_date",
                  type: serverWidget.FieldType.TEXT,
                  label: "Last Activity Date"
                },
                {
                  id: "custpage_pii_removal_rule",
                  type: serverWidget.FieldType.TEXT,
                  label: "PII Removal Rule"
                },
                {
                  id: "custpage_pii_status",
                  type: serverWidget.FieldType.TEXT,
                  label: "Status"
                },
                {
                  id: "custpage_pii_rec_link",
                  type: serverWidget.FieldType.TEXT,
                  label: "PII Record Link"
                }, {
                  id: 'custpage_reviewer_comment',
                  type: serverWidget.FieldType.TEXTAREA,
                  label: 'Reviewer Comment',
                  displayType: serverWidget.FieldDisplayType.ENTRY
                },
                {
                  id: "custpage_pii_entity_id",
                  type: serverWidget.FieldType.TEXT,
                  label: "Entity ID",
                  displayType: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                  id: "custpage_pii_removal_fields",
                  type: serverWidget.FieldType.TEXTAREA,
                  label: "PII Removal Fields",
                  displayType: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                  id: "custpage_pii_entry_ref_link",
                  type: serverWidget.FieldType.TEXT,
                  label: "Entity Reference"
                }
              ],
            },
          ],
        };
      };

      /**
       * Add Invoice and Cash sale column values to the sublist
       * @param {array} addResults - The results array to process.
       * @param {object} customSublist - The custom sublist object.
       */
      addColumnsToSublist = (addResults, customSublist) => {
        addResults.forEach((result, index) => {
          // log.debug("Processing Result", result);

          // Helper to safely set sublist values
          const setSublistValue = (id, value) => {
            if (value !== undefined && value !== null) {
              customSublist.setSublistValue({ id, line: index, value });
            }
          };

          // Add basic fields
          setSublistValue("custpage_pii_entity", result.entity);
          setSublistValue("custpage_pii_entity_type", result.recordTypeText);
          setSublistValue("custpage_pii_status", result.status);
          setSublistValue("custpage_pii_removal_rule", result.piiRemovalRule);
          setSublistValue("custpage_pii_last_activity_date", result.lastActivityDate);
          setSublistValue("custpage_pii_entity_id", result.entityId);
          setSublistValue("custpage_internalid", result.piiInternalId);
          setSublistValue("custpage_pii_removal_fields", result.piiRemovalFields);
          // setSublistValue("custpage_pii_entry_ref_link", result.reflink);




          if (result.piiInternalId) {
            const piiRecordUrl = url.resolveRecord({
              recordType: "customrecord_ft_pii_removal_req",
              recordId: result.piiInternalId,
              isEditMode: false,
            });

            const piiEntry = `<html>
          <a href="${piiRecordUrl}" target="_blank">PII Entry</a>
      </html>`;

            setSublistValue("custpage_pii_rec_link", piiEntry);
          }


          if (result.reflink) {
            const entityRefLink = `<html>
          <a href="${result.reflink}" target="_blank">Entity Reference</a>
      </html>`;
            setSublistValue("custpage_pii_entry_ref_link", entityRefLink);
          }


        });
      };

      /**
       * Fetch the transaction results
       * @param {object} pagedData - The paged search data object.
       * @param {number} pageIndex - The index of the page to fetch.
       * @returns {Array} - An array of formatted transaction data.
       */
      fetchTransactionData = (pagedData, pageIndex) => {
        const functionName = "fetchTransactionData";
        const fieldMapping = [
          "recordType", // Index 0
          "piiRemovalRule", // Index 1
          "status", // Index 2
          "entity", // Index 3
          "lastActivityDate", // Index 4
          "piiRemovalFields", // Index 5
          "recordTypeText", // Index 6
          "piiInternalId", // Index 7
          "entityId",
          "reflink"
        ];
        let results = [];

        try {
          // Fetch the page data
          let searchPage = pagedData.fetch({ index: pageIndex });

          // Validate and process the results
          if (
            !searchPage ||
            !searchPage.data ||
            !Array.isArray(searchPage.data.results)
          ) {
            throw new Error(
              "Invalid or unexpected structure in searchPage.data.results."
            );
          }

          searchPage.data.results.forEach((result) => {
            const formattedRecord = {};
            fieldMapping.forEach((fieldName, index) => {
              formattedRecord[fieldName] = result.values[index] || null;
            });
            results.push(formattedRecord);
          });

          return results;
        } catch (ex) {
          let errorStr = ex.name
            ? `${ex.name}: ${ex.message}\nStack Trace: ${ex.stack}`
            : ex.toString();
          log.error(
            "Error",
            `A problem occurred in ${functionName}: ${errorStr}`
          );
          return results; // Return an empty array if an error occurs
        }
      };

      /**
       * Adds default values to the form
       * @param {object} piiReviewRequestEntryForm
       * @param {object} params
       */
      addDefaultValues = (
        piiReviewRequestEntryForm,
        { recType, entity }
      ) => {
        const functionName = "addDefaultValues";
        let processStr = "";
        try {
          piiReviewRequestEntryForm.updateDefaultValues({
            custpage_pii_rec_type_filter: recType,
            custpage_pii_entity_filter: entity
          });
        } catch (ex) {
          let errorStr =
            ex.name != null
              ? ex.name + "</br>" + ex.message + "</br>" + ex.stack + "</br>"
              : ex.toString();
          log.error(
            "Error",
            `A problem occured whilst ${processStr}: <br>${errorStr}<br>functionName>>>>${functionName}`
          );
        }
      };

      /**
       * Listen to the form submit event and tracks the URL params
       * @param {object} paramsObj
       */
      formSubmitListener = (paramsObj) => {
        // log.debug('paramsObj',paramsObj);
        const functionName = "formSubmitListener";
        let processStr = "";
        let self = this;
        let hasUrlParam = false;
        const validationParams = ["recType", "entity"];

        try {
          for (const property in paramsObj) {
            let hasParam = validationParams.includes(property);
            if (hasParam) {
              hasUrlParam = true;
              break;
            }
          }
        } catch (ex) {
          let errorStr =
            ex.name != null
              ? ex.name + "</br>" + ex.message + "</br>" + ex.stack + "</br>"
              : ex.toString();
          log.error(
            "Error",
            `A problem occured whilst ${processStr}: <br>${errorStr}<br>functionName>>>>${functionName}`
          );
        }

        return hasUrlParam;
      };
    }

    return {
      uiComponentWrapper(context) {
        if (this.instance) {
          return this.instance;
        }
        this.instance = new UIComponent(context);
        return this.instance;
      },
    };
  });