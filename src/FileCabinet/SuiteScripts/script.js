function taxCodeField_beforeLoad_UE(type){
var taxCodeFieldonForm = nlapiGetLineItemField('expense', 'taxcode', 1);
//if Tax Code field is on the Form
if (taxCodeFieldonForm){
taxCodeFieldonForm.setMandatory(false);
}
}