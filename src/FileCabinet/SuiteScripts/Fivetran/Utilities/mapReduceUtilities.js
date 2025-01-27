/**
@NApiVersion 2.1
@NModuleScope SameAccount
 */
define([], function () {
  /**
Function to run the error iterator for the reduce stage
   *
@param {(Object)} summaryContext
@returns {Object} List of Errors
   */
  const inputSummary = (summaryContext) => {
    return summaryContext.inputSummary.error;
  };
  const mapSummary = (summaryContext) => {
    let errorList = [];
    summaryContext.mapSummary.errors.iterator().each(function (key, value) {
      errorList.push({ key: key, error: value });
      return true;
    });
    return errorList;
  };
  const reduceSummary = (summaryContext) => {
    let errorList = [];
    summaryContext.reduceSummary.errors.iterator().each(function (key, value) {
      errorList.push({ key: key, error: value });
      return true;
    });
    return errorList;
  };
  return {
    inputSummary,
    mapSummary,
    reduceSummary
  };
});






