/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(["N/search", "N/ui/message", "N/url", "N/currentRecord", "N/https","N/runtime"], /**
 * @param search
 * @param message
 * @param{url} url
 * @param currentRecord
 * @param https
 */ function (search, message, url, currentRecord, https, runtime) {
  let globalContext;
  const SUBLIST_ID = "custpage_pii_sublist";


  function pageInit(scriptContext) {
    globalContext = scriptContext;
  }


  function getParameterFromURL(param) {
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split("=");
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }

  function markAllApprovalHandler() {
    const functionName = "markAllApprovalHandler";
    let processStr = "";
    let self = this;
    let id = "custpage_approve";

    try {
      setAllMarks(true, id);
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
  }



  /**
   * [unmarkAllApprovalHandler description]
   * @return {[type]} [description]
   */
  function unmarkAllApprovalHandler() {
    const functionName = "unmarkAllApprovalHandler";
    let processStr = "";
    let self = this;
    let id = "custpage_approve";

    try {
      processStr = "setAllUnMarks";
      setAllMarks(false, id);
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
  }

  

  /**
   * [setAllMarks description]
   * @param {Boolean} isMarked [description]
   * @param id
   */
  function setAllMarks(isMarked, id) {
    const functionName = "setAllMarks";
    let processStr = "";
    let self = this;

    try {
      let currRec = currentRecord.get();
      let itemCount = currRec.getLineCount({
        sublistId: SUBLIST_ID,
      });

      for (let x = 0; x < itemCount; x++) {
        setSublistVal(currRec, id, isMarked, x);
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
  }

  /**
   * [setSublistVal description]
   * @param {[type]} currRec [description]
   * @param {[type]} field   [description]
   * @param {[type]} value   [description]
   * @param {[type]} line    [description]
   */
  function setSublistVal(currRec, field, value, line) {
    currRec.selectLine({
      sublistId: SUBLIST_ID,
      line: line,
    });

    currRec.setCurrentSublistValue({
      sublistId: SUBLIST_ID,
      fieldId: field,
      value: value,
      ignoreFieldChange: true,
    });

    currRec.commitLine({
      sublistId: SUBLIST_ID,
    });
  }



  function rejectPIIEntries(){
    const functionName = "rejectPIIEntries";
    let processStr = "";

    try{

      let approveCnt = _getApproveCount();
      // Validation check before processing
      if (approveCnt === 0) {
        alert("Please select at least one entry");
        return;
      }

      const thisRec = globalContext.currentRecord;
      thisRec.setValue({
        fieldId: "custpage_pii_action",
        value: "reject",
        ignoreFieldChange: true,
      });

      const rejectedId = runtime.getCurrentUser().id;
      thisRec.setValue({
        fieldId: "custpage_pii_rejectby",
        value: rejectedId,
        ignoreFieldChange: true,
      });
  

      window.onbeforeunload = null;
      // Submit the form to call suitelet POST method on demand.
      jQuery("[type='submit']").click();

      if (approveCnt > 0) {
        let jobSubmission = message.create({
          title: " PII Entry Rejection",
          message:
            "PII Entry Rejection processing is in Progress. Please refresh the page after sometime.",
          type: message.Type.INFORMATION,
        });
        jobSubmission.show();
        setTimeout(jobSubmission.hide, 15000); // will disappear after 15s

    }
  }
    catch (ex) {
      let errorStr =
        ex.name != null
          ? ex.name + "</br>" + ex.message + "</br>" + ex.stack + "</br>"
          : ex.toString();
      log.error(
        "Error",
        `A problem occured whilst ${processStr}: <br>${errorStr}<br>functionName>>>>${functionName}`
      );
    }
  }


  function approvePIIEntries() {
    const functionName = "approvePIIEntries";
    let processStr = "";

    try {

      let approveCnt = _getApproveCount();
      // Validation check before processing
      if (approveCnt === 0) {
        alert("Please select at least one entry");
        return;
      }

      const thisRec = globalContext.currentRecord;
      const action = thisRec.setValue({
        fieldId: "custpage_pii_action",
        value: "approve",
        ignoreFieldChange: true,
      });

      const approverId = runtime.getCurrentUser().id;
      thisRec.setValue({
        fieldId: "custpage_pii_approvedby",
        value: approverId,
        ignoreFieldChange: true,
      });
  

      window.onbeforeunload = null;
      // Submit the form to call suitelet POST method on demand.
      jQuery("[type='submit']").click();

      if (approveCnt > 0) {
        let jobSubmission = message.create({
          title: " PII Entry Approval",
          message:
            "PII Entry Approval processing is in Progress. Please refresh the page after sometime.",
          type: message.Type.INFORMATION,
        });
        jobSubmission.show();
        setTimeout(jobSubmission.hide, 15000); // will disappear after 15s
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
  }

  function _getApproveCount() {
    const functionName = "_getApproveCount";
    let processStr = "";

    try {
      const thisRec = globalContext.currentRecord;
      const numLines = thisRec.getLineCount({
        sublistId: SUBLIST_ID,
      });

      let approveCounter = 0;
      for (let i = 0; i < numLines; i++) {
        let isApproved = thisRec.getSublistValue({
          sublistId: SUBLIST_ID,
          fieldId: "custpage_approve",
          line: i,
        });
        if (isApproved === true || isApproved === "T") {
          approveCounter++;
        }
      }

      return approveCounter;
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
  }

  function checkStatus() {
    const functionName = "checkStatus";
    let processStr = "";

    try {
      let scheduledscriptinstanceSearchObj = search.create({
        type: "scheduledscriptinstance",
        filters: [
          ["scriptdeployment.title", "is", "[FT] - MR Approve PII Removal Entries"],
          "AND",
          ["status", "anyof", "PROCESSING", "PENDING"],
        ],
        columns: [
          search.createColumn({
            name: "percentcomplete",
            label: "Percent Complete",
          }),
          search.createColumn({ name: "status", label: "Status" }),
        ],
      });
      let searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;

      if (searchResultCount > 0) {
        let jobSubmission = message.create({
          title: "Status",
          message: "Status is in progress....",
          type: message.Type.INFORMATION,
        });
        jobSubmission.show();
        setTimeout(jobSubmission.hide, 50000); // will disappear after 15s
        location.reload();
      } else {
        let jobSubmission = message.create({
          title: "Status",
          message: "Status is completed....",
          type: message.Type.CONFIRMATION,
        });
        jobSubmission.show();
        setTimeout(jobSubmission.hide, 50000); // will disappear after 15s
        location.reload();
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
  }

  function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
    let formFieldsObj = getFormFields(globalContext.currentRecord);
   // let { empNum, deptCode, workorder } = formFieldsObj;

    /* This will remove that weird alert box on change
                of the page Index or in case of moving to the next page*/
    window.onbeforeunload = null;

    document.location = url.resolveScript({
      scriptId: suiteletScriptId,
      deploymentId: suiteletDeploymentId,
      params: {
        page: pageId
      },
    });
  }

  function fieldChanged(scriptContext) {
    const SUBLIST_ID = "custpage_pii_sublist"; // Sublist ID
    const APPROVE_FIELD_ID = "custpage_approve"; // Checkbox field ID

    try {
      let currentRec = scriptContext.currentRecord;
      let sublistId = scriptContext.sublistId; // Get sublist ID
      let fieldId = scriptContext.fieldId; // Get changed field ID

      // Existing logic for filtering and page reload
      let triggerFieldChange = listenEventHandler(fieldId);
      if (triggerFieldChange) {
        let fieldsObj = getFormFields(currentRec);
        let { recType } = fieldsObj;

          var pageId=currentRec.getValue({
          fieldId : 'custpage_pageid'
        });

        // Split the character "_"
        pageId = parseInt(pageId.split("_")[1]);

        // Remove the onbeforeunload alert box and reload the page
        window.onbeforeunload = null;
        document.location = url.resolveScript({
          scriptId: 3163,
          deploymentId: 1,
          params: {
            page: pageId,
            recType:recType
          },
        });
      }
    } catch (error) {
      log.error("Error in fieldChanged", error);
    }
  }

  function listenEventHandler(fieldId) {
    if (fieldId === "custpage_pageid") {
      return true;
    }
  }

  function getFormFields(curRec) {
    let pageId = curRec.getValue({
      fieldId: "custpage_pageid",
    });
    let recType = curRec.getValue({
      fieldId: "custpage_pii_rec_type_filter",
    });
    let entity = curRec.getValue({
      fieldId: "custpage_pii_entity_filter",
    });

    return {
      pageId: pageId,
      recType: recType,
      entity: entity
    };
  }
  

  return {
    getParameterFromURL: getParameterFromURL,
    getSuiteletPage: getSuiteletPage,
    markAllApprovalHandler: markAllApprovalHandler,
    unmarkAllApprovalHandler: unmarkAllApprovalHandler,
    checkStatus: checkStatus,
    fieldChanged: fieldChanged,
    approvePIIEntries:approvePIIEntries,
    pageInit:pageInit,
    rejectPIIEntries:rejectPIIEntries
  };
});
