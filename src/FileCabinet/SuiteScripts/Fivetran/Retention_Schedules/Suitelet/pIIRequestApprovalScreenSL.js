/**
@NApiVersion 2.1
@NScriptType Suitelet
 */
define([
  "N/record",
  "/SuiteScripts/Fivetran/Retention_Schedules/Library/piiRequestApprovalModel",
], /**
@param{record} record
@param piiRequestModel
 */
(record, piiRequestModel) => {
  /**
Defines the Suitelet script trigger point.
@param {Object} scriptContext
@param {ServerRequest} scriptContext.request - Incoming request
@param {ServerResponse} scriptContext.response - Suitelet response
@since 2015.2
   */
  const onRequest = (scriptContext) => {
    const functionName = "onRequest";
    let processStr = "";
    try {
      let objRequest = scriptContext.request;
      let reqMethod = objRequest.method;
      let piiRequestModelInstance =
      piiRequestModel.piiRequestModelWrapper(scriptContext);
      switch (reqMethod) {
        case "GET":
          piiRequestModelInstance.handleGetOperation();
          break;
        case "POST":
          piiRequestModelInstance.handlePostOperation();
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
  };
  return { onRequest };
});






