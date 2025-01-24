/**
 * UtilityBelt2.0.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(function() {
  /**
   * This function checks if the passed value is Null or Undefined.
   *
   * @param  {String|Number|Array}  value The value that will be checked.
   * @return {Boolean}       True if value is null or undefined, false if otherwise.
   */
  function nullUndefined(value) {
    if (value === null) {
      return true;
    }
    return value === undefined;
  }

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  /**
   * This function removes extra specified character from the left of the String.
   *
   * @param  {String} str   String to process.
   * @param  {String} chars Optional. The character to be removed from the left side.
   *                        Defaults to space if blank.
   * @return {String}       Processed string.
   */
  function leftTrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("^[" + escapeRegExp(chars) + "]+", "g"), "");
  }

  /**
   * This function removes extra specified character from the right of the String.
   *
   * @param  {String} str   String to process.
   * @param  {String} chars Optional. The character to be removed from the right side.
   *                        Defaults to space if blank.
   * @return {String}       Processed string.
   */
  function rightTrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("[" + escapeRegExp(chars) + "]+$", "g"), "");
  }

  /**
   * This function removes extra specified character from the left and right of the String.
   *
   * @param  {String} str   String to process.
   * @param  {String} chars Optional. The character to be removed from the left and right side.
   *                        Defaults to space if blank.
   * @return {String}       Processed string.
   */
  function trim(str, chars) {
    return leftTrim(rightTrim(str, chars), chars);
  }

  /**
   * This function executes the NetSuite search.
   *
   * @param  {search} search_obj The NetSuite search object.
   * @return {Array}            Array contain the search result objects.
   */
  function executeSearch(search_obj) {
    var pagedData = search_obj.runPaged({ pageSize: 1000 });

    var search_result = [];
    pagedData.pageRanges.forEach(function(pageRange) {
      pagedData
        .fetch({ index: pageRange.index })
        .data.forEach(function(result) {
          search_result.push(result);
          return true;
        });

      return true;
    });

    log.debug({
      title: "Execute Search",
      details: "Number of Records Found:=" + search_result.length
    });

    return search_result;
  }

  /**
   * This function checks if the string or array is empty.
   *
   * @param  {string|array|object}  stValue The value that will be checked.
   * @return {Boolean}         True is the value is empty, false if otherwise.
   */
  function isEmpty(stValue) {
    switch (true) {
      case isString(stValue) === true:
        return isBlank(stValue) || (!stValue || 0 === stValue.length);
      case isArray(stValue) === true:
        return stValue.length === 0;
      case nullUndefined(stValue) === true:
        return true;
      case isObject(stValue) === true:
        return isObjectEmpty(stValue);
      default:
        return false;
    }
  }

  function forceParseInt(variable, base) {
    base = isEmpty(base) === true ? 10 : base;
    var value = !isEmpty(variable)
      ? parseInt(("" + variable).replace(/[^\d\.-]/gi, ""), base)
      : 0;

    return !isNaN(value) ? value : 0;
  }

  function forceParseFloat(variable) {
    var value = !isEmpty(variable)
      ? parseFloat(("" + variable).replace(/[^\d\.-]/gi, ""))
      : 0;

    return !isNaN(value) ? value : 0;
  }

  /**
   * Wrapper for SS2.0 N/format.format method. Converts a Date object into a date string
   * in the date format specified in the current NetSuite account.
   * For client side scripts, the string returned is based on the user’s system time.
   * For server-side scripts, if you do not provide a timeZone parameter the string returned
   * is based on the system time of the server your NetSuite system is running on.
   *
   * @param  {Date} date       Date object to be converted into date string format
   * @param  {enum} formatType Holds the string values for the supported field types.
   * @param  {enum} timeZone   Holds the valid time zone names in Olson Value, the date will be converted to this time zone.
   *                           If a time zone is not specified, the time zone is set based on the server your NetSuite system is running on.
   *                           If the time zone is invalid, the time zone is set to GMT.
   * @return {string}          The formatted value as a string.
   */
  function dateToString(date, formatType, timeZone) {
    var value = "";

    require(["N/format"], function(format) {
      value = format.format({
        value: date,
        type: formatType,
        timezone: format.Timezone[timeZone]
      });
    });

    return value;
  }

  /**
   * Wrapper for SS2.0 N/format.parse method. Converts a string date into a Date object.
   *
   * @param  {Date} date       Date object to be converted into date string format
   * @param  {enum} formatType Holds the string values for the supported field types.
   * @return {Date}
   */
  function stringToDate(date, formatType) {
    var value = "";

    require(["N/format"], function(format) {
      value = format.parse({
        value: date,
        type: formatType
      });
    });

    return value;
  }

  function closeSuitelet() {
    var html = [];
    html.push("<html>");
    html.push("<head>");
    html.push("<script>");
    html.push("window.close()");
    html.push("</script>");
    html.push("</head>");
    html.push("<body>");
    html.push("</body>");
    html.push("</html>");

    html = html.join("");

    return html;
  }

  /**
   * Converts 'T' or 'F' to its Boolean counterpart
   *
   * @param  {String|Boolean} val 'T' or 'F'
   * @return {Boolean}     true or false
   */
  function toBoolean(val) {
    if (!nullUndefined(val)) {
      if (typeof val === "boolean") {
        return val;
      } else {
        if (val === "T") {
          return true;
        }
      }
    }
    return false;
  }

  function isNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function isString(value) {
    return typeof value === "string" || value instanceof String;
  }

  function isArray(value) {
    return value && typeof value === "object" && value.constructor === Array;
  }

  function isObject(value) {
    return !!value && value.constructor === Object;
  }
  function isObjectEmpty(obj) {
    var k;
    for (k in obj) {
      // even if its not own property I'd still call it non-empty
      return false;
    }
    return true;
  }
  function isBlank(str) {
    return !str || /^\s*$/.test(str);
  }

  function resultsToObject(results) {
    var jsonResult = [];

    results.forEach(function(result) {
      var columns = result.columns;

      var jsonData = {
        id: result.id,
        recordType: result.recordType,
        values: {}
      };

      columns.forEach(function(column) {
        var index = "";
        if (isEmpty(column.join) === false) {
          index = column.name + "." + column.join;
        } else {
          index = column.name;
        }

        var columnValue = result.getValue(column);
        var columnText = result.getText(column);

        if (isEmpty(columnText) === true) {
          jsonData.values[index] = columnValue
        } else {
          jsonData.values[index] = {
            text: columnText,
            value: columnValue
          }
        }

        return true;
      });
      jsonResult.push(jsonData);

      return true;
    });

    return jsonResult;
  }

  /**
   * Gets the values of the script data
   * @param parameters {object} The object containing the ids of the script data
   * @return {{}}
   */
  function getScriptParameterValues(parameters) {
    var parameterObject = {};
    require(["N/runtime"], function(NsRuntime) {
      Object.keys(parameters).map(function(keyMember) {
        parameterObject[
          parameters[keyMember]
        ] = NsRuntime.getCurrentScript().getParameter({
          name: parameters[keyMember]
        });
      });
    });

    return parameterObject;
  }


  var exports = {};

  exports.leftTrim = leftTrim;
  exports.rightTrim = rightTrim;
  exports.trim = trim;
  exports.executeSearch = executeSearch;
  exports.isNullUndefined = nullUndefined;
  exports.isEmpty = isEmpty;
  exports.forceInteger = forceParseInt;
  exports.forceFloat = forceParseFloat;
  exports.dateToString = dateToString;
  exports.stringToDate = stringToDate;
  exports.closeSuitelet = closeSuitelet;
  exports.resultsToObject = resultsToObject;
  exports.toBoolean = toBoolean;
  exports.isNumber = isNumber;
  exports.isArray = isArray;
  exports.isString = isString;
  exports.isBlank = isBlank;
  exports.getScriptParameterValues = getScriptParameterValues;
  exports.isObjectEmpty = isObjectEmpty;
  exports.replaceAll = replaceAll
  return exports;
});
