/**
 * Author: Atna Rose
 * 
 *This script is to auto populate the tax rate to 0 when the Is Third Party Payer Transaction is true. 
 *Here we set the Tax override to true and tax rate to 0.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([],

    function () {



        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            try {
                var rec = scriptContext.newRecord;
                var thirdPartyInv = rec.getValue({
                    fieldId: 'custbodyis_tpp_transaction'
                });
                if (thirdPartyInv) {
                    rec.setValue({
                        fieldId: 'custbody_ava_taxoverride',
                        value: true
                    })
                    rec.setValue({
                        fieldId: 'taxrate',
                        value: 0
                    })

                }
            } catch (e) {
               log.error("ERROR", e);
            }

        }

        return {
            beforeSubmit: beforeSubmit
        };

    });
