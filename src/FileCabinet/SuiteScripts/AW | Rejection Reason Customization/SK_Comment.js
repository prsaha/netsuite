function rejectReasonForm(request, response) {
  nlapiLogExecution(
    "DEBUG",
    "rejectReasonForm",
    "==================== SUITELET START ===================="
  );

  var recordType = nlapiLookupField(
    "transaction",
    request.getParameter("custpage_recordid"),
    "recordtype"
  );

  var Comments = request.getParameter("custpage_comment");

  nlapiLogExecution(
    "DEBUG",
    "rejectReasonForm",
    [
      "recordType:",
      recordType,
      " | Comments:",
      Comments,
      " | request.getMethod():",
      request.getMethod(),
    ].join("")
  );
  var tranData = nlapiLookupField(
    recordType,
    request.getParameter("custpage_recordid"),
    ["tranid", "entity"]
  );
  nlapiLogExecution("DEBUG", "rejectReasonForm", ["tranData:", JSON.stringify(tranData)].join(""));

  var tranid = tranData["tranid"]
  var entity = tranData["entity"];
  var entityname ='';
  if(entity)
   entityname = nlapiLookupField("entity", entity, "entityid");
  nlapiLogExecution("DEBUG", "rejectReasonForm", ["tranid:", tranid, " | entity:", entity, " | entityname:", entityname].join(""));

  if (request.getMethod() == "GET") {
    // create the form

    var form = nlapiCreateForm(
      recordType.toUpperCase() +
        " " +
        tranid +
        " for " +
        entityname +
        " is Rejected.  Please Enter Rejection Reason."
    );

    // add fields to the form
    var field = form.addField("custpage_comment", "textarea", " ");
    var field1 = form
      .addField("custpage_recordid", "text", " ")
      .setDisplayType("hidden");
    form.setFieldValues({
      custpage_recordid: request.getParameter("custpage_recordid"),
    });

    var a =
      "'" +
      nlapiResolveURL(
        "RECORD",
        recordType,
        request.getParameter("custpage_recordid"),
        false
      ) +
      "'";

    form.addSubmitButton("Submit");
    // form.addButton('custpage_cancel','Cancel','if(confirm(\'Do you want to Cancel without submitting Rejection Reason ?\')) { document.forms[0].custpage_comment.value=\'-\'; window.location=' + a + '; }' );
    form.addButton(
      "custpage_cancel",
      "Cancel",
      "if(confirm('Do you want to Cancel without submitting Rejection Reason ?')) { document.forms[0].custpage_comment.value='Rejection reason is not entered.'; document.forms[0].submit(); }"
    );
    response.writePage(form);
  } else if (
    request.getMethod() == "POST" &&
    request.getParameter("custpage_comment") == ""
  ) {
    // create the form
    var form = nlapiCreateForm('Rejection Reason cannot be empty. Pls enter Rejection Reason.');

    // add fields to the form
    var field = form.addField("custpage_comment", "textarea", " ");
    var field1 = form
      .addField("custpage_recordid", "text", " ")
      .setDisplayType("hidden");
    form.setFieldValues({
      custpage_recordid: request.getParameter("custpage_recordid"),
    });

    var a =
      "'" +
      nlapiResolveURL(
        "RECORD",
        recordType,
        request.getParameter("custpage_recordid"),
        false
      ) +
      "'";
    form.addSubmitButton("Submit");
    form.addButton(
      "custpage_cancel",
      "Cancel",
      "if(confirm('Do you want to Cancel without submitting Rejection Reason ?')) { document.forms[0].custpage_comment.value='Rejection Reason not entered.'; document.forms[0].submit(); }"
    );
    response.writePage(form);
  } else if (request.getMethod() === "POST") {
    nlapiLogExecution(
      "DEBUG",
      "rejectReasonForm",
      "---------- Updating record with reason ----------"
    );

    nlapiLogExecution(
      "DEBUG",
      "rejectReasonForm",
      [
        "recordType:",
        recordType,
        " | custpage_recordid:",
        request.getParameter("custpage_recordid"),
        " | custbody_aw_rejection_note:",
        request.getParameter("custpage_comment"),
      ].join("")
    );

    nlapiSubmitField(
      recordType,
      request.getParameter("custpage_recordid"),
      "custbody_aw_rejection_note",
      request.getParameter("custpage_comment")
    );

    var tranRecord = nlapiLoadRecord(
      recordType,
      request.getParameter("custpage_recordid")
    );
    tranRecord.setFieldValue(
      "custbody_aw_rejection_note",
      request.getParameter("custpage_comment")
    );
    var recId = nlapiSubmitRecord(tranRecord);
    nlapiLogExecution(
      "DEBUG",
      "rejectReasonForm",
      ["Record has been saved. Id:", recId].join("")
    );

    nlapiSetRedirectURL("RECORD", recordType, recId);
  }

  nlapiLogExecution(
    "DEBUG",
    "rejectReasonForm",
    "==================== SUITELET END ===================="
  );
}
