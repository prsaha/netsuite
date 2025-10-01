define(["N/query", "N/util", "N/record"], /**
 * @param{query} query
 * @param{util} util
 * @param record
 */
(query, util, record) => {
/**
 * Utility to run paginated queries
 * @param {Object} options - The configuration object
 * @param {string} options.sql - Base SQL query string
 * @param {number} [options.limit=9999999999] - Maximum number of records
 * @param {number} [options.pageSize=5000] - Number of records per page
 * @param {string} options.queryName - Identifier for the query (for logging)
 * @returns {Array} - Combined results from all pages
 */

 const runQuery = ({ sql, limit, pageSize,queryName }) => {

  const functionName = "runQuery";
  let processStr = "";
  let self = this;
  let records = [];

  try {

      if (!sql) return [];

      const sqlPageSize = pageSize || 5000;
      let paginatedRowBegin = 1;
      const paginatedRowEnd = limit || 9999999999;
      let isMoreRecords = true;
      const startTime = new Date().getTime();
      do {
          const paginatedSQL = `SELECT * FROM (SELECT ROWNUM AS ROWNUMBER, * FROM (  ${sql} ) )  WHERE ( ROWNUMBER BETWEEN ${paginatedRowBegin} AND ${paginatedRowEnd} )`;
          const queryResults = query.runSuiteQL({query: paginatedSQL, params: []}).asMappedResults();
          records.push(...queryResults);
          if (queryResults.length < sqlPageSize) {
              isMoreRecords = false;
          }
          paginatedRowBegin += sqlPageSize;
      } while (isMoreRecords);

      log.debug(`queryFetch (${queryName}) total time>>>>>>>>`,
          (new Date().getTime() - startTime) / 1000);

  }
  catch (ex) {
      let errorStr = (ex.name != null) ? ex.name + '</br>' + ex.message + '</br>' + ex.stack + '</br>' : ex.toString();
      log.error('Error',
          `A problem occured whilst ${processStr}: <br>${errorStr}<br>functionName>>>>${functionName}`);

  }

  return records;
};


  /**
   * Native Pagination
   * @param {string} sql
   * @returns {*[]}
   */
  const queryFetch = ({ sql }) => {
    const functionName = "queryFetch";
    let processStr = "";
    let results = [];

    try {
      const queryResult = query.runSuiteQLPaged({
        query: sql,
        pageSize: 1000,
      });

      queryResult.pageRanges.forEach((page, index) => {
        queryResult.fetch({ index }).data.results.forEach((rowObj) => {
          results.push(rowObj.asMap());
        });
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

    return results;
  };

  /*  Pagination for search results
   * @param {string} sql
   * @returns {*[]}
   */
  const runPagedQuery = (sql, pageSize) => {
    return query.runSuiteQLPaged({
      query: sql,
      pageSize: pageSize,
    });
  };

  /************** Custom Form Utilities **************/

  /**
   * addSubtabs - Add subtab to the form
   *
   * @param  {Form} form    description
   * @param  {Array} subtabs Array of subtabs containing id, label, tab(if applicable)
   */
  const addSubTabs = (form, subtabs) => {
    if (subtabs) {
      for (let i = 0; i < subtabs.length; i++) {
        form.addSubtab(subtabs[i]);
      }
    }
  };

  /**
   * addButtons - Adds button to the form
   *
   * @param  {Form}  form    form object
   * @param  {Array} buttons Array of button containing id, label, and functionName
   */
  const addButtons = (form, buttons) => {
    if (buttons) {
      for (let i = 0; i < buttons.length; i++) {
        form.addButton(buttons[i]);
      }
    }
  };

  /**
   * addFields - Adds fields to the form
   *
   * @param  {Form}  form    form object
   * @param  {Array} fields Array of fields containing id, label, source and type
   */
  const addFields = (form, fields) => {
    if (fields) {
      for (let i = 0; i < fields.length; i++) {
        let field = form.addField(fields[i]);
        setFieldProperties(field, fields[i]);
        if (field.id === "custpage_wb_batch_id") {
          field.updateDisplaySize({
            height: 60,
            width: 41,
          });
        }
      }
    }
  };

  /**
   * addSublists - Adds sublist to the form
   *
   * @param  {Form}  form    form object.
   * @param  {Array} sublists Array of fields containing id, label, source and type.
   */
  const addSublists = (form, sublists) => {
    if (sublists) {
      for (let i = 0; i < sublists.length; i++) {
        var customSublist = form.addSublist(sublists[i]);

        let sublistButtons = sublists[i].buttons;
        for (let j = 0; j < sublistButtons.length; j++) {
          customSublist.addButton(sublistButtons[j]);
        }

        let sublistFields = sublists[i].fields;
        for (let j = 0; j < sublistFields.length; j++) {
          let sublistColumnField = customSublist.addField(sublistFields[j]);
          setFieldProperties(sublistColumnField, sublistFields[j]);
        }
        if (sublists[i].markAll) {
          customSublist.addMarkAllButtons();
        }
      }
    }

    return customSublist;
  };

  /**
         * setFieldProperties - Sets properties to the field object
         * This function is also used when setting properties of sublist fields
         *

         */
  var setFieldProperties = (field, obj) => {
    if (obj.help) {
      field.setHelpText(obj.help);
    }

    if (obj.defaultValue) {
      field.defaultValue = obj.defaultValue;
    }

    if (obj.linkText) {
      field.linkText = obj.linkText;
    }

    if (obj.breakType) {
      field.updateBreakType({ breakType: obj.breakType });
    }

    if (obj.layoutType) {
      field.updateLayoutType({ layoutType: obj.layoutType });
    }

    if (obj.isMandatory) {
      field.isMandatory = obj.isMandatory;
    }

    if (obj.maxLength) {
      field.maxLength = obj.maxLength;
    }

    if (obj.displayType) {
      field.updateDisplayType({ displayType: obj.displayType });
    }

    if (obj.displaySize) {
      field.updateDisplaySize(obj.displaySize);
    }

    if (obj.selectOptions) {
      addSelectOptions(field, obj.selectOptions);
    }
  };

  /**
   * @param {string} checkVar
   * @return {boolean}
   */
  const isEmpty = (checkVar) => {
    return checkVar == null || false || checkVar === "" || checkVar === "null";
  };

  const isNullOrEmptyObject = (obj) => {
    let hasOwnProperty = Object.prototype.hasOwnProperty;

    if (obj.length && obj.length > 0) {
      return false;
    }
    for (let key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  };

  return {
    queryFetch,
    runQuery,
    addSubTabs,
    addButtons,
    runPagedQuery,
    addFields,
    addSublists,
    isEmpty,
    isNullOrEmptyObject,
  };
});
