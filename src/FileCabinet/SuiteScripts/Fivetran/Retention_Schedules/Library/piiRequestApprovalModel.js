define([
  "N/task",
  "N/query",
  "N/record",
  "N/url",
  "SuiteScripts/Fivetran/Retention_Schedules/Library/piiRequestScreenUIComp"
], (
  task,
  query,
  record,
  url,
  uiComponent
) => {
  class piiModel {
    constructor(scriptContext) {
      this.context = scriptContext;
    }
    handleGetOperation = () => {
      try {
        let uiComponentInstance = uiComponent.uiComponentWrapper(this.context);
        uiComponentInstance.buildPiiRequestReviewForm();
      } catch (ex) {
        log.error("Error in handleGetOperation", ex);
      }
    };
    handlePostOperation = () => {
      try {
        let params = this.context.request.parameters;
        const action = params["custpage_pii_action"];
        const isApproveAction = action === "approve";
        const isRejectAction = action === "reject";
        if (isApproveAction) {
          const approver = params["custpage_pii_approvedby"];
          this._submitPIIEntries(approver, "approve");
        }
        if (isRejectAction) {
          const rejector = params["custpage_pii_rejectby"];
          this._submitPIIEntries(rejector, "reject");
        }
        this.addParamsToURL(params);
      } catch (ex) {
        log.error("Error in handlePostOperation", ex);
      }
    };
    addParamsToURL = (params) => {
      try {
        const {
          custpage_pii_rec_type_filter: recType,
          custpage_pii_entity_filter: entity,
          script,
          deploy
        } = params;
        const scheme = "https://";
        const host = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        const link = url.resolveScript({ scriptId: script, deploymentId: deploy });
        let redirectUrl = `${scheme}${host}${link}&recType=${recType}&entity=${entity}&script=${script}&deploy=${deploy}`;
        const html = `<script>window.open("${redirectUrl}", "_self");</script>`;
        this.context.response.writeLine(html);
      } catch (ex) {
        log.error("Error in addParamsToURL", ex);
      }
    };
    _submitPIIEntries = (userId, action) => {
      try {
        const piiEntryList = this._getSublistValues(this.context.request, userId, action);
        if (piiEntryList && piiEntryList.length > 0) {
          const _task = task.create({ taskType: task.TaskType.MAP_REDUCE });
          _task.scriptId = "customscript_ft_mr_approve_pii_rem_entry";
          _task.params = {
            custscript_ft_sp_apprvd_pii_entries: JSON.stringify(piiEntryList)
          };
          const taskId = _task.submit();
          log.debug("Map/Reduce Task Submitted", taskId);
        }
      } catch (ex) {
        log.error("Error in _submitPIIEntries", ex);
      }
    };
    _getSublistValues = (request, userId, action) => {
      try {
        const numLines = request.getLineCount({
          group: "custpage_pii_sublist",
          name: "custpage_approve"
        });
        const sublistValues = [];
        for (let i = 0; i < numLines; i++) {
          const isSelected = request.getSublistValue({
            group: "custpage_pii_sublist",
            name: "custpage_approve",
            line: i
          });
          if (isSelected !== "T") continue;
          const piiEntryId = request.getSublistValue({
            group: "custpage_pii_sublist",
            name: "custpage_internalid",
            line: i
          });
          const entityId = request.getSublistValue({
            group: "custpage_pii_sublist",
            name: "custpage_pii_entity_id",
            line: i
          });
          const entityType = request.getSublistValue({
            group: "custpage_pii_sublist",
            name: "custpage_pii_entity_type",
            line: i
          });
          const piiFields = request.getSublistValue({
            group: "custpage_pii_sublist",
            name: "custpage_pii_removal_fields",
            line: i
          });

          const reviewerComment = request.getSublistValue({
            group: "custpage_pii_sublist",
            name: "custpage_reviewer_comment",
            line: i
          });
          log.debug('reviewerComment',reviewerComment);
          
          sublistValues.push({
            piiEntryId,
            entityId,
            entityType,
            piiFields,
            approver: userId,
            action,
            reviewerComment
          });
        }
        return sublistValues;
      } catch (ex) {
        log.error("Error in _getSublistValues", ex);
      }
    };
  }
  return {
    piiRequestModelWrapper(context) {
      if (this.instance) return this.instance;
      this.instance = new piiModel(context);
      return this.instance;
    }
  };
});









