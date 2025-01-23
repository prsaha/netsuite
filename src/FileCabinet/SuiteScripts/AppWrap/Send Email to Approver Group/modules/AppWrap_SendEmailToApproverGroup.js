/*
 *  Copyright (c) 2024
 *  AppWrap LLC
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of AppWrap LLC. ('Confidential Information').
 *  You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the
 *  license agreement you entered into with AppWrap LLC.
 *
 * AppWrap LLC Code Disclaimer
 * ================================================================================
 * This code has been provided by AppWrap LLC, a NetSuite consulting firm specializing
 * in integration and IT solutions. The following terms and conditions apply to
 * the use of this code by the recipient:
 *
 * 1. Use of Code:
 *   This code is provided to the recipient for the sole purpose of addressing
 *   specific integration or IT challenges as discussed between AppWrap LLC and the
 *   recipient. Any use of this code for purposes other than its intended use
 *   requires prior written consent from AppWrap LLC.
 *
 * 2. No Warranty:
 *    This code is provided "as is" and without any warranty, express or implied.
 *    AppWrap LLC does not guarantee the accuracy, reliability, or suitability of this
 *    code for any particular purpose. The recipient acknowledges that the use of
 *    this code is at their own risk.
 *
 * 3. Limitation of Liability:
 *    In no event shall AppWrap LLC be liable for any direct, indirect, incidental,
 *    special, exemplary, or consequential damages arising in any way out of the
 *    use of this code, even if advised of the possibility of such damage.
 *
 * 4. Support and Modifications:
 *    AppWrap LLC is not obligated to provide support, maintenance, or updates for
 *    this code. However, the recipient may contact AppWrap LLC for additional
 *    assistance or modifications, subject to mutually agreed-upon terms.
 *
 * 5. Intellectual Property:
 *    All intellectual property rights to this code, including but not limited to
 *    copyrights, trademarks, and trade secrets, are owned by AppWrap LLC. The
 *    recipient is prohibited from reproducing, distributing, or modifying this
 *    code without explicit written permission from AppWrap LLC.
 *
 * By using this code, the recipient agrees to comply with the terms and conditions
 * outlined above. If you have any questions or concerns about the use of this code,
 * please contact AppWrap LLC at support@appwrap.tech.
 *
 * --------------------------------------------------------------------------------
 *
 *  Script Description:
 *  This module contains all the main logic for sending the email to the approvers
 *
 *  |---------------------------------------------------------------------------------------------------------------------------------------|
 *  | Author                      | Date          | Version       | Comments                                                                |
 *  |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *  | Gerrom V. Infante           | Mar/08/2024   | 1.0           | Initial Version                                                         |
 *  |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */
define((require) => {
  /**
   * This module contains all the main logic for sending the email to the approvers
   *
   * @type {Object} AppWrap_SendEmailToApproverGroup.js
   *
   * @copyright 2024 AppWrap LLC
   * @author Gerrom V. Infante <ginfan@appwrap.tech>
   *
   * @NApiVersion 2.1
   * @NModuleScope Public
   */
  const exports = {};
  const moduleName = "AppWrap_SendEmailToApproverGroup.js";

  // NS modules
  const nsSearch = require("N/search");
  const nsRender = require("N/render");
  const nsFile = require("N/file");
  const nsUrl = require("N/url");
  const nsEmail = require("N/email");
  const nsRecord = require("N/record");

  // custom and third party modules
  const utilityBelt = require("../../lib/AppWrap_UtilityBelt");
  const AppWrapAjv = require("../../lib/AppWrap_ajv7_8.12.0.min");

  /**
   * This constructs the SendEmailToApprovers class
   */
  class SendEmailToApproversGroup {
    #logTitle = `${moduleName}.SendEmailToApproversGroup`;
    #recordObject;
    #parameterValues;
    #scriptParameters = {
      recordTypeToGroupMap: {
        id: "custscript_aw_wa_grp_em_map",
        isMandatory: true,
      },
      emailTemplate: {
        id: "custscript_aw_wa_grp_em_template",
        isMandatory: true,
      },
      sender: {
        id: "custscript_aw_wa_grp_em_sender",
        isMandatory: true,
      },
      copy: {
        id: "custscript_aw_wa_grp_em_copy",
        isMandatory: false,
      },
      includePDF: {
        id: "custscript_aw_wa_grp_em_inc_pdf",
        isMandatory: false,
      },
      generateUrl: {
        id: "custscript_aw_wa_grp_em_rec_link",
        isMandatory: false,
      },
      sendAttachments: {
        id: "custscript_aw_wa_grp_em_attach_files",
        isMandatory: false,
      },
    };
    #groupMapDefinition = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      patternProperties: {
        "/^w+$/": {
          type: "object",
          anyOf: [
            { required: ["groupInfo"] },
            { required: ["savedSearch"] },
            { required: ["customRecord"] },
          ],
          properties: {
            groupInfo: {
              type: "object",
              properties: {
                internalId: {
                  type: "string",
                },
                groupType: {
                  type: "string",
                },
              },
              required: ["internalId", "groupType"],
            },
            savedSearch: {
              type: "object",
              properties: {
                searchId: {
                  type: "string",
                },
                searchColumn: {
                  type: "string",
                },
              },
              required: ["searchId", "searchColumn"],
            },
            customRecord: {
              type: "object",
              properties: {
                recordType: {
                  type: "string",
                },
                internalId: {
                  type: "string",
                },
                fieldId: {
                  type: "string",
                },
              },
              required: ["recordType", "internalId", "fieldId"],
            },
          },
        },
      },
    };

    /**
     * The constructor method of the class
     * @param {Record} recordObject The NetSuite record objec being processed
     */
    constructor(recordObject) {
      this.#recordObject = recordObject;
      this.#parameterValues = utilityBelt.getScriptParameterValues(
        this.#scriptParameters
      );
      log.debug({
        title: `${moduleName}.constructor`,
        details: `parameters: ${JSON.stringify(this.#parameterValues)}`,
      });
    }

    /**
     * This method is part of the SendEmailToApproversGroup class and is used to send an email to an approver group. It
     * calls the private method #sendEmailToApprovers() to perform the actual email sending.
     *
     * @returns {object} The result object, which contains the success flag and additional details about the email
     * sending process.
     */
    sendEmailToApproverGroup() {
      return this.#sendEmailToApprovers();
    }

    /**
     * The #sendEmailToApprovers method is responsible for sending an email to a group of approvers. It first validates
     * the configuration JSON to ensure it is correct. If the configuration is valid, it proceeds to send the email
     * using the #sendEmail method. The method returns a result object indicating the success of the email sending
     * operation.
     *
     * @returns {object} A result object indicating the success of the email sending operation.
     */
    #sendEmailToApprovers() {
      const result = {};

      // validate if the map configuration JSON is correct
      const validConfig = this.#validateConfiguration();
      if (validConfig.isValid === false) {
        log.error({
          title: `${this.#logTitle}.sendEmailToApprovers`,
          details: "Invalid configuration JSON",
        });
        result.success = false;
        result.errors = validConfig.errors;
      } else {
        log.debug({
          title: `${this.#logTitle}.sendEmailToApprovers`,
          details: "Configuration JSON is valid",
        });

        result.success = true;
        result.details = this.#sendEmail();
      }

      return result;
    }

    /**
     * The #generateCompleteLink method generates a complete link by combining the file URL with the application domain.
     *
     * @param {string} fileUrl The URL of the file
     * @returns {string} The complete link combining the application domain and the file URL
     */
    #generateCompleteLink(fileUrl) {
      const domain = nsUrl.resolveDomain({
        hostType: nsUrl.HostType.APPLICATION,
      });

      const encodedFileUrl = encodeURIComponent(fileUrl);

      return `https://${domain}${encodedFileUrl}`;
    }

    /**
     * The #generateFileLinks method generates HTML links for each file in the arrFiles array. It checks if the file is
     * in a folder (not the transaction PDF) and sets the isOnline property to true. It then saves the file, loads it
     * again, and creates an HTML link with the file name and URL.
     *
     * @param {File[]} arrFiles An array of file objects
     * @returns {string} A string containing HTML links for each file in the arrFiles array.
     */
    #generateFileLinks(arrFiles) {
      const stLogTitle = `${this.#logTitle}.generateFileLinks`;

      const links = arrFiles.map((fileMember) => {
        log.debug({
          title: stLogTitle,
          details: `fileMember.folder: ${fileMember.folder}`,
        });

        if (fileMember.folder !== -1) {
          // the transaction pdf will have the folder value as -1
          // make the file available without login
          fileMember.isOnline = true;
          let reportFile = fileMember.save();

          reportFile = nsFile.load({ id: reportFile });
          return `Click <a href='${this.#generateCompleteLink(
            reportFile.url
          )}'>${reportFile.name}</a> to download the file`;
        }
      });
      log.debug({
        title: stLogTitle,
        details: `links: ${links.join("<br/>")}`,
      });

      return links.join("<br/>");
    }

    /**
     * The #getEmailInformation method is responsible for merging an email template with the provided transaction ID
     * and returning the merged email information.
     *
     * @returns {EmailMergeResult} The merged email information
     */
    #getEmailInformation() {
      const templateId = this.#parameterValues.emailTemplate;

      const transactionId = parseInt(this.#recordObject.id, 10);

      return nsRender.mergeEmail({
        templateId,
        transactionId,
      });
    }

    /**
     * The #getFilesAttachedToRecord method is responsible for retrieving files attached to a record.
     * It removes duplicate files and returns an array of file objects.
     *
     * @param {object} param The object containing the function parameters
     * @param {string} param.type The record type of the record being processed
     * @param {string} param.id The internal id of the record being processed
     * @returns {File[]} An array of file objects attached to the record.
     */
    #getFilesAttachedToRecord(param) {
      const logTitle = `${this.#logTitle}.getFilesAttachedToRecord`;

      const foundFiles = this.#findAttachments(param);

      const arrFiles = [];
      if (utilityBelt.isEmpty(foundFiles) === false) {
        const ResultsObject = utilityBelt.resultsToObject(foundFiles);
        log.debug({
          title: logTitle,
          details: `ResultsObject: ${JSON.stringify(ResultsObject)}`,
        });

        // remove duplicate members
        const uniqueResults = utilityBelt.uniqueFromObjectArray(ResultsObject);
        log.debug({
          title: logTitle,
          details: `uniqueResults: ${JSON.stringify(uniqueResults)}`,
        });

        uniqueResults.forEach((result) => {
          const stFileId = result.values["internalid.file"].value;

          if (utilityBelt.isEmpty(stFileId) === false) {
            log.debug({ title: logTitle, details: `stFileId: ${stFileId}` });

            arrFiles.push(
              nsFile.load({
                id: stFileId,
              })
            );
          }
        });
      }

      return arrFiles;
    }

    /**
     * This method searches for the files that are attached to the record being processed
     *
     * @param {object} param The object containing the function parameter values
     * @param {string} param.type The record type of the record being processed
     * @param {string} param.id The internal id of the record being processed
     * @returns {Result[]}  An array of search result objects
     */
    #findAttachments({ type, id }) {
      const filters = [
        nsSearch.createFilter({
          name: "internalid",
          operator: nsSearch.Operator.ANYOF,
          values: [id],
        }),
        nsSearch.createFilter({
          name: "mainline",
          operator: nsSearch.Operator.IS,
          values: ["T"],
        }),
      ];

      const columns = [
        nsSearch.createColumn({ name: "internalid", join: "file" }),
      ];

      const searchResult = utilityBelt.executeSearch(
        nsSearch.create({
          type,
          filters,
          columns,
        })
      );
      return searchResult;
    }

    /**
     * Creates a PDF of the transaction with the given transaction ID.
     *
     * @param {number} transactionId - The ID of the transaction.
     * @returns {File} The file object of the PDF of the transaction.
     */
    #createTransactionPDF(transactionId) {
      return nsRender.transaction({
        entityId: transactionId,
        printMode: nsRender.PrintMode.PDF,
      });
    }

    /**
     * The #getRecordLink method is responsible for generating a URL link to a NetSuite record based on the provided
     * transaction record object.
     *
     * @param {Record} transactionRecord The transaction record object
     * @returns {string} The URL link to the NetSuite record
     */
    #getRecordLink(transactionRecord) {
      const PROTOCOL = "https://";
      const nsDomain = nsUrl.resolveDomain({
        hostType: nsUrl.HostType.APPLICATION,
      });
      const recordLink = nsUrl.resolveRecord({
        recordType: transactionRecord.type,
        recordId: transactionRecord.id,
      });

      return `${PROTOCOL}${nsDomain}${recordLink}`;
    }

    /**
     * The #generateRecordLink method is responsible for generating a URL link to a NetSuite record based on the
     * provided transaction record object. It returns an HTML anchor tag with the generated record link.
     *
     * @param {Record} transactionRecord The transaction record object
     * @returns {string} The URL link to the NetSuite record
     */
    #generateRecordLink(transactionRecord) {
      const stLogTitle = "generateRecordLink";

      const recordLink = this.#getRecordLink(transactionRecord);
      log.debug({ title: stLogTitle, details: `RecordLink: ${recordLink}` });

      // generate the table containing the record link
      return `<a href="${recordLink}">Click here to view record in NetSuite</a>`;
    }

    /**
     * The #validateConfiguration method is responsible for validating the configuration JSON using a JSON schema. It
     * uses the AJV based AppWrapAjv library to compile the schema and validate the configuration against it.
     *
     * @returns {{isValid: boolean , errors:object}} An object containing the validation results.
     */
    #validateConfiguration() {
      const logTitle = `${this.#logTitle}.validateConfiguration`;

      log.audit({ title: logTitle, details: "Validating Config" });

      const ajv = new AppWrapAjv({
        logger: false,
      });

      const validator = ajv.compile(this.#groupMapDefinition);

      const isValid = validator(
        JSON.parse(this.#parameterValues.recordTypeToGroupMap)
      );
      log.debug({
        title: logTitle,
        details: `isValid: ${isValid}`,
      });

      if (!isValid) {
        log.error({
          title: logTitle,
          details: `Errors in Config: ${JSON.stringify(validator.errors)}`,
        });
      }
      return { isValid, errors: validator.errors };
    }

    #sendEmail() {
      const logTitle = `${this.#logTitle}.sendEmail`;

      const emailInformation = this.#getEmailInformation();

      // check if the option to include the attached emails to the email is true
      let emailAttachments = [];
      if (
        utilityBelt.toBoolean(this.#parameterValues.sendAttachments) === true
      ) {
        emailAttachments = this.#getFilesAttachedToRecord({
          type: this.#recordObject.type,
          id: this.#recordObject.id,
        });
      }
      log.debug({
        title: logTitle,
        details: `EmailAttachments: ${JSON.stringify(emailAttachments)}`,
      });

      // check if the option to include the transaction pdf is true
      const recordId = Number(this.#recordObject.id);
      if (utilityBelt.toBoolean(this.#parameterValues.includePDF) === true) {
        emailAttachments.push(this.#createTransactionPDF(recordId));
      }

      // check if cc option is populated
      let copyOnEmail = [];
      if (this.#parameterValues.copy) {
        copyOnEmail = this.#parameterValues.copy.split(/\s*,\s*/);
      }
      log.debug({
        title: logTitle,
        details: `EmailCC: ${JSON.stringify(copyOnEmail)}`,
      });

      let stBody = emailInformation.body;

      let recordLink = "";
      let downloadLinks = "";
      if (utilityBelt.toBoolean(this.#scriptParameters.generateUrl) === true) {
        recordLink = this.#generateRecordLink(this.#recordObject);
      }
      stBody = stBody.replace("{{recordlink}}", recordLink);

      const { sender } = this.#parameterValues;

      const recipients = this.#getGroupRecipients({
        groupMap: this.#parameterValues.recordTypeToGroupMap,
      });
      try {
        let emailBody = stBody;
        emailBody = emailBody.replace("{{downloadlinks}}", "");

        const objSend = {
          author: sender,
          recipients,
          subject: emailInformation.subject,
          cc: copyOnEmail,
          body: emailBody,
          attachments: emailAttachments,
          relatedRecords: {
            transactionId: recordId,
          },
        };
        // log.debug("Checking", "objSend " + JSON.stringify(objSend));

        // send email
        nsEmail.send(objSend);
      } catch (e) {
        // log.audit({ title: logTitle, details: `error: ${e}` });
        if (
          e.name === "ATTACH_SIZE_EXCEEDED" ||
          e.name === "SSS_FILE_CONTENT_SIZE_EXCEEDED"
        ) {
          log.audit({ title: logTitle, details: "Sending email with link" });

          const fileLinks = this.#generateFileLinks(emailAttachments);
          downloadLinks = `Files are too big to attach. Download links are available below:<br/><br/>${fileLinks}`;
          let tempBody = stBody;
          tempBody = tempBody.replace("{{downloadlinks}}", downloadLinks);

          const objSend = {
            author: sender,
            recipients,
            subject: emailInformation.subject,
            cc: copyOnEmail,
            body: tempBody,
            relatedRecords: {
              transactionId: recordId,
            },
          };

          // send email
          nsEmail.send(objSend);
        } else {
          throw e;
        }
      }
    }

    #getGroupRecipients({ groupMap }) {
      const logTitle = `${this.#logTitle}.#getGroupRecipients`;

      const groupMapObject = JSON.parse(groupMap);
      log.debug({
        title: logTitle,
        details: `groupMap: ${JSON.stringify(groupMapObject)}`,
      });

      const recordMap = groupMapObject[this.#recordObject.type];
      log.debug({
        title: logTitle,
        details: `recordMap: ${JSON.stringify(recordMap)}`,
      });

      let recipients = [];
      if (utilityBelt.isEmpty(recordMap) === false) {
        // get the configuration to determine where to get the group approvers
        switch (true) {
          case utilityBelt.isEmpty(recordMap["groupInfo"]) === false: {
            recipients = this.#getApproversFromGroup({
              groupInfo: recordMap["groupInfo"],
            });
            break;
          }
          case utilityBelt.isEmpty(recordMap["savedSearch"]) === false: {
            recipients = this.#getApproversFromSavedSearch({
              savedSearch: recordMap["savedSearch"],
            });
            break;
          }
          case utilityBelt.isEmpty(recordMap["customRecord"]) === false: {
            recipients = this.#getApproversFromCustomRecord({
              customRecord: recordMap["customRecord"],
            });
            break;
          }
        }
      }

      return recipients;
    }

    /**
     * This method retrieves the list of approvers from a specified group in NetSuite.
     * @param {object} options An object containing the group information.
     * @param {object} options.groupInfo An object containing the internal ID and group type of the group.
     * @returns {string[]}  An array of approvers retrieved from the specified group.
     */
    #getApproversFromGroup(options) {
      const logTitle = `${this.#logTitle}.#getApproversFromGroup`;

      const groupRecord = nsRecord.load({
        type: options.groupInfo.groupType,
        id: options.groupInfo.internalId,
      });

      const lineCount = groupRecord.getLineCount({ sublistId: "groupmembers" });
      log.debug({
        title: logTitle,
        details: `lineCount: ${lineCount}`,
      });

      return Array.from({ length: lineCount }, (_, i) =>
        groupRecord.getSublistValue({
          sublistId: "groupmembers",
          fieldId: "memberkey",
          line: i,
        })
      );
    }

    /**
     * This method retrieves the list of approvers from a saved search in NetSuite.
     *
     * @param {object} options An object that contains the searchId and searchColumn properties.
     * @param {string} options.searchId The internal ID of the saved search.
     * @param {string} options.searchColumn The name of the column in the saved search to retrieve
     * @returns {string[]} An array of email addresses of the approvers retrieved from the saved search
     */
    #getApproversFromSavedSearch(options) {
      const searchObject = nsSearch.load({ id: options.searchId });

      const searchResults = utilityBelt.executeSearch(searchObject);

      let recipients = [];
      if (utilityBelt.isEmpty(searchResults) === false) {
        recipients = searchResults.map((searchResult) =>
          searchResult.getValue({ name: options.searchColumn })
        );
      }

      return recipients;
    }

    /**
     * This method retrieves the value of a specific field from a custom record.
     *
     * @param {object} options An object containing the following properties:
     * @param {object} options.customRecord An object containing the following properties:
     * @param {object} options.customRecord.fieldId The internal ID of the field to retrieve
     * @param {object} options.customRecord.recordType The type of the custom record to retrieve
     * @param {object} options.customRecord.internalId The internal ID of the custom record to retrieve
     * @returns {*} The value of the specified field from the custom record.
     */
    #getApproversFromCustomRecord(options) {
      const customRecord = nsRecord.load({
        type: options.customRecord.recordType,
        id: options.customRecord.internalId,
      });

      return customRecord.getValue({ fieldId: options.customRecord.fieldId });
    }
  }
  exports.SendEmailToApproversGroup = SendEmailToApproversGroup;

  return exports;
});
