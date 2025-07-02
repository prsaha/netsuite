/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
    'N/search',
    'N/file',
    'N/render',
    'N/record',
    'N/log',
    'N/runtime',
    'N/email',
    '/SuiteScripts/Fivetran/Utilities/mapReduceUtilities'
], function (search, file, render, record, log, runtime, email, mrUtils) {

    // Constants
    const SCRIPT_PARAMS = {
        SEARCH_ID: 'custscript_ft_sp_inv_pdf_gen_ss',
        TEMPLATE_ID: 'custscript_ft_sp_inv_pdf_tmpl_id',
        FOLDER_ID: 'custscript_ft_sp_staged'
    };

    function getInputData(context) {
        try {
            const scriptObj = runtime.getCurrentScript();

            // Validate parameters early
            const params = {
                searchId: scriptObj.getParameter({ name: SCRIPT_PARAMS.SEARCH_ID }),
                templateId: scriptObj.getParameter({ name: SCRIPT_PARAMS.TEMPLATE_ID }),
                folderId: scriptObj.getParameter({ name: SCRIPT_PARAMS.FOLDER_ID })
            };

            if (!params.searchId) throw new Error('Missing saved search ID parameter');
            if (!params.templateId) throw new Error('Missing template ID parameter');
            if (!params.folderId) throw new Error('Missing folder ID parameter');

            // Load and validate search
            const invoiceSearch = search.load({ id: params.searchId });
            const resultCount = invoiceSearch.runPaged().count;

            if (resultCount === 0) {
                log.warning('No Results', 'Saved search returned 0 invoices');
                return [];
            }

            log.audit('Search Loaded', `${resultCount} invoices found`);
            return invoiceSearch;

        } catch (e) {
            log.error('Input Data Failure', {
                message: e.message,
                stack: e.stack
            });
            throw e;
        }
    }

    function map(context) {
        try {
            const searchResult = JSON.parse(context.value);
            let invoiceId = parseInt(searchResult.id, 10);
            let invDocNumber = searchResult?.values?.tranid;
            if (isNaN(invoiceId)) {
                throw new Error(`Invalid invoice ID format: ${searchResult.id}`);
            }

            const scriptObj = runtime.getCurrentScript();
            const config = {
                templateId: scriptObj.getParameter({ name: SCRIPT_PARAMS.TEMPLATE_ID }),
                folderId: parseInt(scriptObj.getParameter({ name: SCRIPT_PARAMS.FOLDER_ID }), 10)
            };

            // Validate numeric IDs
            if (isNaN(config.folderId)) throw new Error('Invalid folder ID format');

            const fileName = `${invDocNumber}.pdf`;

            if (!fileExists(config.folderId, fileName)) {

                const pdfContent = render.transaction({
                    entityId: invoiceId,
                    printMode: render.PrintMode.PDF,
                    templateId: config.templateId
                });

                pdfContent.name = fileName;
                pdfContent.folder = config.folderId;
                pdfContent.isOnline = true;
                pdfContent.save();

            }

        } catch (e) {
            log.error('Processing Error', {
                invoiceId: invoiceId || 'UNKNOWN',
                message: e.message,
                stack: e.stack
            });
        }
    }

    function fileExists(folderId, fileName) {
        try {
            return search.create({
                type: "folder",
                filters:
                    [
                        ["file.name", "is", fileName],
                        "AND",
                        ["internalid", "anyof", folderId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" })
                    ]
            }).run().getRange({ start: 0, end: 1 }).length > 0;
        } catch (e) {
            log.warning('File Check Error', e.message);
            return false;
        }
    }

    function sendSuccessEmail() {
        const scriptObj = runtime.getCurrentScript();
        const recipient = scriptObj.getParameter({
            name: "custscript_ft_sp_recipient",
        });
        const authorId = scriptObj.getParameter({
            name: "custscript_st_sp_author_id",
        });
        const subject =
            "Invoice PDF Generation - Job Completed Successfully";
        const body = `
            Dear User,<br><br>
            The Invoice PDF Generation job has completed successfully.<br><br>
            Thank you!
        `;
        email.send({
            author: authorId,
            recipients: recipient,
            subject: subject,
            body: body,
        });
        log.debug("Email Sent", `Success report sent to ${recipient}`);
    }

    function summarize(summary) {
        //Handle map summary errors.
        let mapErrors = mrUtils.mapSummary(summary);

        if (mapErrors.length === 0) {
            log.audit({
                title: "Map Reduce Summary",
                details: {
                    summary: summary
                }
            });
        }

        if (mapErrors.length > 0) {
            log.error({
                title: `Map Reduce Summary with ${mapErrors.length} errors`,
                details: {
                    summary: summary,
                    errors: mapErrors
                }
            });
        }

        sendSuccessEmail();
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});