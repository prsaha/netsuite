/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/email', 'N/record', 'N/runtime', '/SuiteScripts/Fivetran/Utilities/mapReduceUtilities'],
    function (search, email, record, runtime, mrUtils) {
        const PII_RECORD_TYPE = 'customrecord_ft_pii_removal_req';
        const PII_REMOVAL_PENDING_STATUS = 'Pending';

        function getInputData() {
            const savedSearchId = runtime.getCurrentScript().getParameter({
                name: 'custscript_ft_rs_pii_entity_ss'
            });
            return search.load({ id: savedSearchId });
        }

        function map(context) {
            const result = JSON.parse(context.value);
            log.debug('map | raw result', result);

            let entityId, entityName, entityType;

            const typeIndicator = result.values['GROUP(formulatext)']; // "Entity" or "Partner"
            const lastTxnModified = result.values['MAX(lastmodifieddate.transaction)'];
            const emailAddr = result.values['GROUP(email)'];

            if (typeIndicator === 'Partner') {
                entityId = result.values['GROUP(partner.transaction)'].value;
                entityName = result.values['GROUP(partner.transaction)'].text;
                entityType = 'Partner';
            } else {
                entityId = result.values['GROUP(internalid)'].value;
                entityName = result.values['GROUP(entityid)'];
                entityType = result.values['GROUP(type)'].text || 'Entity';
            }

            log.debug('map | entityObj', {
                entityId,
                entityName,
                lastTxnModified,
                entityType,
                emailAddr
            });

            context.write({
                key: entityId,
                value: JSON.stringify({
                    internalId: entityId,
                    name: entityName,
                    entityType: entityType,
                    lastTxnDate: lastTxnModified,
                    email: emailAddr
                })
            });
        }

        function reduce(context) {
            const piiData = JSON.parse(context.values[0]);
            log.debug('piiData', piiData);

            try {
                // Only create PII records for Employee, Customer, Vendor, Partner
                if (['Employee', 'Customer', 'Vendor', 'Partner'].includes(piiData.entityType)) {
                    const piiId = createPIIRecord(piiData);
                    log.audit('PII Record Created', `${piiData.entityType} ID: ${piiData.internalId}, PII Record ID: ${piiId}`);

                    context.write({
                        key: piiId,
                        value: piiData.internalId
                    });
                } else {
                    log.audit('Skipped entity type', piiData.entityType);
                }

            } catch (error) {
                log.error({
                    title: `Error creating PII record for ID: ${piiData.internalId}`,
                    details: error
                });
            }
        }

        function createPIIRecord(data) {
            log.debug('data.internalId', data.internalId);

            let isInactive = false;
            try {
                const lookup = search.lookupFields({
                    type: data.entityType,
                    id: data.internalId,
                    columns: ['isinactive']
                });
                isInactive = lookup && (lookup.isinactive === true || lookup.isinactive === 'T');
            } catch (e) {
                log.error('Lookup failed', e);
            }

            const piiRec = record.create({ type: PII_RECORD_TYPE, isDynamic: true });
            piiRec.setValue({ fieldId: 'custrecord_ft_rs_pii_entity_internalid', value: data.internalId });
            piiRec.setText({ fieldId: 'custrecord_ft_rs_pii_record_type', text: data.entityType });
            piiRec.setValue({ fieldId: 'custrecord_ft_rs_pii_record_id', value: data.internalId });

            if (data.lastTxnDate) {
                piiRec.setValue({
                    fieldId: 'custrecord_ft_rs_pii_last_activity_date',
                    value: new Date(data.lastTxnDate)
                });
            }

            piiRec.setText({ fieldId: 'custrecord_ft_rs_pii_status', text: PII_REMOVAL_PENDING_STATUS });
            piiRec.setValue({
                fieldId: 'custrecord_ft_rs_pii_flds_to_rmv',
                value: JSON.stringify(getPiiFieldsFromParam(data.entityType))
            });

            const baseUrl = getNetSuiteBaseUrl();
            const path = `/app/common/entity/entity.nl?id=${data.internalId}`;
            const entityUrl = `${baseUrl}${path}`;
            piiRec.setValue({ fieldId: 'custrecord_ft_rs_pii_enty_ref_link', value: entityUrl });

            // If entity is inactive, mark checkbox on PII record
            piiRec.setValue({
                fieldId: 'custrecord_ft_pii_entity_inactive',
                value: isInactive
            });

            // Only link active entity to the entity field
            if (!isInactive && data.name) {
                piiRec.setValue({ fieldId: 'custrecord_ft_rs_pii_record_entity', value: data.internalId });
            }

            const piiId = piiRec.save();

            if (piiId) {
                try {
                    record.submitFields({
                        type: data.entityType,
                        id: data.internalId,
                        values: { custentity_ft_rs_pii_rec_created: true }
                    });
                } catch (e) {
                    log.error('submitFields failed', e);
                }
            }

            return piiId;
        }


        function getNetSuiteBaseUrl() {
            const acctRaw = runtime.accountId ? String(runtime.accountId).trim().toLowerCase() : '';
            let acct = acctRaw.replace(/_/g, '-');
            const hasSandboxSuffix = /-sb\d+$/.test(acct);

            if (runtime.envType === runtime.EnvType.SANDBOX) {
                return hasSandboxSuffix
                    ? `https://${acct}.app.netsuite.com`
                    : `https://${acct}-sb1.app.netsuite.com`;
            } else {
                acct = acct.replace(/-sb\d+$/, '');
                return `https://${acct}.app.netsuite.com`;
            }
        }

        function getPiiFieldsFromParam(recordType) {
            var piiConfigRaw = runtime.getCurrentScript().getParameter({
                name: 'custscript_sp_pii_removal_fields'
            });
            if (!piiConfigRaw) {
                log.error('Missing PII Config', 'Script parameter is empty or missing');
                return [];
            }
            try {
                var piiMap = JSON.parse(piiConfigRaw);
                return piiMap[recordType.toLowerCase()] || [];
            } catch (e) {
                log.error('Invalid JSON Format in PII Config Param', e);
                return [];
            }
        }

        function summarize(summary) {
            let mapErrors = mrUtils.mapSummary(summary);
            let reduceErrors = mrUtils.reduceSummary(summary);

            let totalRecords = 0;
            summary.output.iterator().each(() => {
                totalRecords++;
                return true;
            });

            log.debug('totalRecords', totalRecords);

            if (totalRecords > 0) {
                const script = runtime.getCurrentScript();
                const authorId = script.getParameter({ name: 'custscript_ft_sp_email_author_id' });
                const recipients = script.getParameter({ name: 'custscript_ft_sp_recipients' });

                if (authorId && recipients) {
                    const recipientList = recipients.split(',').map(r => r.trim()).filter(r => r);

                    const subject = 'PII Review Notification';
                    const body = `
                    Hi Team,

                    The PII Removal Tool has created ${totalRecords} record(s) for review.  
                    Please check the PII Records list in NetSuite and take the necessary action.

                    Thanks,  
                    NetSuite
                `;

                    recipientList.forEach(recipient => {
                        email.send({
                            author: authorId,
                            recipients: recipient,
                            subject: subject,
                            body: body
                        });
                    });
                }
            }
        }

        return { getInputData, map, reduce, summarize };
    });
