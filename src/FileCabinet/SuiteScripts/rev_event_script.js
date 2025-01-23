// Create Record
var revRecEvent = record.create({
    type: record.Type.BILLING_REVENUE_EVENT
});
revRecEvent.setValue({
    fieldId: 'transactionline',
    value: 12    // Transaction Line ID
});
revRecEvent.setValue({
    fieldId: 'eventtype',
    value: 2     // Event Type internal ID
});
revRecEvent.setValue({
    fieldId: 'eventpurpose',
    value: 'FORECAST'
});
revRecEvent.setValue({
    fieldId: 'eventdate', 
    value: new Date('12/31/2016')
});
revRecEvent.setValue({
    fieldId: 'quantity',
    value: 1
});
var recID = revRecEvent.save();

//Load Record
var rec = record.load({
    type: record.Type.BILLING_REVENUE_EVENT,
    id: recID
}); 