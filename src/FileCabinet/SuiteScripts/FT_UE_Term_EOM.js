/**
 * 
 *This script is to populate the due date based on 60days EOM. If the record is getting created not through UI.
 *If the term is 60days EOM the script will populate the due date when record is saved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([],
   
    function() {
    
        function beforeSubmit(context) {   
            try{

                    var invoiceObj = context.newRecord;
                    var term = invoiceObj.getValue({
                        fieldId: 'terms'
                    });
                    if (term == 14) {
                    var date = invoiceObj.getValue({
                    fieldId: 'trandate',
                    });
                    log.debug('date',date);
                    var dueDate = new Date(date);   
                    dueDate.setDate(dueDate.getDate() + 60);
                    var lastDayOfMonth = getLastDayOfMonth(dueDate);
                    log.debug('Last day of month', lastDayOfMonth);
                    invoiceObj.setValue({
                        fieldId: 'duedate',
                        value: lastDayOfMonth
                        });
                    }
 
    
        }catch(e)
        {
            log.debug("error function",e)
        }
            
        }
        function getLastDayOfMonth(date) {
            var year = date.getFullYear();
            var month = date.getMonth() + 1; 
            return new Date(year, month, 0); 
        }
    
        return {
            beforeSubmit : beforeSubmit 
        };
    
    });
    