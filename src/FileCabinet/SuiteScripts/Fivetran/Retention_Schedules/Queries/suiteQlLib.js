/**
@NApiVersion 2.1
 *
Copyright (c) 2024  311 Cloud Consulting.
Austin, Texas
All Rights Reserved.
 *
This software is the confidential and proprietary information of
311 Cloud Consulting ("Confidential Information"). You shall not
disclose such Confidential Information and shall use it only in
accordance with the terms of the license agreement you entered into
with 311 Cloud Consulting.
 *
 */
/**
Author: 311 Cloud Dev
 */
define([], () => {
  const sqlModule = (query) => {
    let queryStr = "";
    switch (query) {
      case "GET_PII_INFO":
        queryStr = `
          SELECT
              pii_req.custrecord_ft_rs_pii_record_type           AS record_type,
              pii_req.custrecord_ft_rs_pii_removal_rule          AS removal_rule,
              BUILTIN.DF(pii_req.custrecord_ft_rs_pii_status)    AS status,
              BUILTIN.DF(pii_req.custrecord_ft_rs_pii_record_entity) AS record_entity,
              pii_req.custrecord_ft_rs_pii_last_activity_date    AS last_activity_date,
              pii_req.custrecord_ft_rs_pii_flds_to_rmv           AS fields_to_remove,
              BUILTIN.DF(pii_req.custrecord_ft_rs_pii_record_type)           AS record_type_text,
              pii_req.id           AS piiInternalId,
              pii_req.custrecord_ft_rs_pii_entity_internalid           AS entityId,
              pii_req.custrecord_ft_rs_pii_enty_ref_link AS reflink

              FROM
                  CUSTOMRECORD_FT_PII_REMOVAL_REQ AS pii_req
              WHERE
                  BUILTIN.DF(pii_req.custrecord_ft_rs_pii_status) IN ('Pending')
             `;
        break;
      default:
        queryStr = "";
        break;
    }
    return queryStr;
  };
  return {
    sqlModule,
  };
});









