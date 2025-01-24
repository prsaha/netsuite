/**
 * 
 *This script is to populate the due date based on 60days EOM. 
 *If the term is 60days EOM the script will populate the due date when the record is loaded,if the date is changed or if the term is changed.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function () {

        function pageInit(context) {
            var invoiceObj = context.currentRecord;
            var date = invoiceObj.getValue({
                fieldId: 'trandate'
            });
            var term = invoiceObj.getValue({
                fieldId: 'terms'
            });
            if (term == 14) {
                var dueDate = new Date(date);
                dueDate.setDate(dueDate.getDate() + 60);
                console.log('dueDate', dueDate);
                var lastDayOfMonth = getLastDayOfMonth(dueDate);
                console.log('Last day of month', lastDayOfMonth);;
                invoiceObj.setValue({
                    fieldId: 'duedate',
                    value: lastDayOfMonth
                });
            }
            return true;
        }

        /**
        * Function to be executed when field is slaved.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.sublistId - Sublist name
        * @param {string} scriptContext.fieldId - Field name
        *
        * @since 2015.2
        */
        function postSourcing(context) {
            var invoiceObj = context.currentRecord;

            if (context.fieldId == 'terms') {

                var date = invoiceObj.getValue({
                    fieldId: 'trandate'
                });
                var term = invoiceObj.getValue({
                    fieldId: 'terms'
                });
                if (term == 14) {
                    var dueDate = new Date(date);
                    dueDate.setDate(dueDate.getDate() + 60);
                    console.log('dueDate', dueDate);
                    var lastDayOfMonth = getLastDayOfMonth(dueDate);
                    console.log('Last day of month', lastDayOfMonth);;
                    invoiceObj.setValue({
                        fieldId: 'duedate',
                        value: lastDayOfMonth
                    });
                }
                return true;
            }
        }

        function fieldChanged(context) {
            var invoiceObj = context.currentRecord;

            if (context.fieldId == 'trandate') {
                console.log('dueDate field change');

                var date = invoiceObj.getValue({
                    fieldId: 'trandate'
                });
                var term = invoiceObj.getValue({
                    fieldId: 'terms'
                });
                if (term == 14) {
                    var dueDate = new Date(date);
                    dueDate.setDate(dueDate.getDate() + 60);
                    console.log('dueDate', dueDate);
                    var lastDayOfMonth = getLastDayOfMonth(dueDate);
                    console.log('Last day of month', lastDayOfMonth);;
                    invoiceObj.setValue({
                        fieldId: 'duedate',
                        value: lastDayOfMonth
                    });
                }
            }

        }

        function getLastDayOfMonth(date) {

            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            return new Date(year, month, 0);

        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing

        };
    });