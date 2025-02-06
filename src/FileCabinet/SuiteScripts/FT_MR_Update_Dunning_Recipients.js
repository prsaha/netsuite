/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/runtime'],

function(search,record,runtime) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        
        //
        var customerSearchObj = search.create({
            type: "customer",
            filters:
            [
                [
                    [["isinactive","is","F"],"AND",["category","noneof","@NONE@"]], 
                    "AND", 
                    [["salesrep","noneof","@NONE@"],"OR",["email","isnotempty",""],"OR",["custentitycustentity_email","isnotempty",""]], 
                    "AND", 
                    [[["systemnotes.field","anyof","CUSTJOB.KEMPLOYEE","CUSTENTITYCUSTENTITY_EMAIL","ENTITY.SEMAIL"],"AND",["formulanumeric: case when ({systemnotes.date}>{custentity_ft_dunning_rec_update_date}) then 1 else 0 end","equalto","1"]],"OR",["custentity_ft_dunning_rec_update_date","isempty",""]], 
                    "AND", 
                    ["internalidnumber","equalto","860509"]
                 ]
             ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal id"}),
               search.createColumn({name: "entityid", label: "Name"}),
               search.createColumn({name: "email", label: "Email"}),
               search.createColumn({name: "salesrep", label: "Sales Rep"}),
               search.createColumn({name: "custentitycustentity_email", label: "Additional Emails"}),
               search.createColumn({name: "custentity_ft_dunning_rec_update_date", label: "Contact/Dunning Recipient Update Date"}),
               search.createColumn({
                  name: "email",
                  join: "salesRep",
                  label: "Email"
               }),
               search.createColumn({name: "custentity_ft_dunning_rep_dunning_rec_cr", label: "Create Sales Rep Dunning Recipient"}),

            ]
         });
         var resultArr=[]
         var searchResultCount = customerSearchObj.runPaged().count;
         log.audit("customerSearchObj result count",searchResultCount);
         customerSearchObj.run().each(function(result){
            var id=result.getValue({name:'internalid'});
            var salesRepEmail=result.getValue({name:'email',join:'salesRep'});
            var addEmail=result.getValue({name:'custentitycustentity_email'});
            var email=result.getValue({name:'email'});
            var updateRepDunning=result.getValue({name:'custentity_ft_dunning_rep_dunning_rec_cr'});
            var salesrep=result.getValue({name:'salesrep'});
            var dataObj={}
            dataObj["custId"]=id
            dataObj["salesRepEmail"]=salesRepEmail;
            dataObj["addEmail"]=addEmail;
            dataObj["email"]=email;
            dataObj["updateRepDunning"]=updateRepDunning;
            dataObj["salesrep"]=salesrep;
            resultArr.push(dataObj)
            return true;
         });
         log.audit("resultArr",JSON.stringify(resultArr));

return resultArr;
    }

  
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        try{
        var customerData =JSON.parse(context.values[0]);
        log.audit("customerData",JSON.stringify(customerData));
        log.debug("customeid",customerData.custId);
        log.debug("addEmail",customerData.addEmail);
        log.debug("email",customerData.email);
        log.debug("sales rep email",customerData.salesRepEmail);
        var scriptObj = runtime.getCurrentScript();
        var selfServ=scriptObj.getParameter({name: 'custscript_ft_script_self_service'})
        var firstEmail=customerData.email; 
        var custEmails=[]
        var customerContacts=[];
        if(customerData.addEmail||customerData.email)
        {
            log.debug("entry to email id cond");

        custEmails=removeEmailDuplicate(customerData.addEmail,customerData.email);
        }

        var updateRepDunning=customerData.updateRepDunning;
        log.debug("custEmails1",custEmails);


        if(customerData.salesRepEmail&&customerData.salesRepEmail!=selfServ)
        {
        var salesRepContact=customerData.salesrep//findSalesRepContact(customerData.salesRepEmail)
        }
        
        log.audit("salesRepContact",salesRepContact);

        if(custEmails.length>0)
        {
            log.debug("entry tocustEmails1 ",custEmails);

            var dunningDetails=findExistingDunningDetails(customerData.custId);
            log.debug("dunningDetails",dunningDetails)
            if(dunningDetails.dunningEmail.length>0)
            {
                customerContacts=checkDunningForUpdate(dunningDetails,custEmails,customerData.custId,firstEmail)
                if(customerContacts.length>0)
                {    
                updateDunningRec(customerContacts,dunningDetails,salesRepContact,customerData.custId)
                }
                
                if(updateRepDunning)
                {
                    log.debug("updateRepDunningRecepient",updateRepDunning)
                    updateRepDunningRecepient(salesRepContact,dunningDetails,customerData.custId,customerData.salesRepEmail)
                }

            }else{
               
                customerContacts=createCustomerContacts(custEmails,customerData.custId,firstEmail);
                
                createDunningRec(customerContacts,salesRepContact,customerData.custId)
             }

           
        }else if(salesRepContact||customerData.salesRepEmail==selfServ||(salesRepContact=='' &&updateRepDunning))
        {
            if(updateRepDunning)
                {
                    log.debug("updateRepDunningRecepient",updateRepDunning)
                    var dunningDetails=findExistingDunningDetails(customerData.custId);
                    
                    updateRepDunningRecepient(salesRepContact,dunningDetails,customerData.custId,customerData.salesRepEmail)
                    
                
                }else if(salesRepContact){
            createDunningRec(customerContacts,salesRepContact,customerData.custId)
                }

        }
        }catch(e)
        {
            log.audit("error",e)
            var id = record.submitFields({
                type: record.Type.CUSTOMER,
                id: customerData.custId,
                values: {
                    'custentity_ft_dunning_rec_aut_error':e.message
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            
        }
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    function removeEmailDuplicate(addEmail,email)
    {
        var custEmailAll=[]
        if(addEmail)
        {
        custEmailAll=addEmail.split(',');
        }
        if(email)
        {
        custEmailAll.push(email);
        }
        log.debug("custEmailAll",custEmailAll)
        if(custEmailAll.length>0)
        {
        var custEmailAll=dedupe(custEmailAll);
        log.debug("custEmailAll no duplicate",custEmailAll)
        }
        return custEmailAll;

    }

    function dedupe(custEmailAll)
    {
        return custEmailAll.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
    }

    function findExistingDunningDetails(custId)
    {
        var scriptObj = runtime.getCurrentScript();
        var repDunLevel=scriptObj.getParameter({name: 'custscript_ft_rep_dunning_level_id'})
        
        var customerSearchObj = search.create({
            type: "customer",
            filters:
           [
                ["internalidnumber","equalto",custId], 
      "AND", 
      ["custrecord_3805_dunning_recipient_cust.internalid","noneof","@NONE@"]

   ],
            columns:
            [
               search.createColumn({name: "internalid", label: "Internal ID"}),
               search.createColumn({name: "entityid", label: "Name"}),
               search.createColumn({name: "custentity_3805_dunning_procedure", label: "Dunning Procedure"}),
               search.createColumn({
                  name: "custrecord_3805_dunning_recipient_cont",
                  join: "CUSTRECORD_3805_DUNNING_RECIPIENT_CUST",
                  label: "Contact"
               }),
               search.createColumn({
                  name: "custrecord_dl_recipient_email",
                  join: "CUSTRECORD_3805_DUNNING_RECIPIENT_CUST",
                  label: "Contact Email"
               }),
               search.createColumn({
                  name: "custrecord_dl_dunning_level_recipients",
                  join: "CUSTRECORD_3805_DUNNING_RECIPIENT_CUST",
                  label: "Dunning Level"
               }),
               search.createColumn({
                  name: "internalid",
                  join: "CUSTRECORD_3805_DUNNING_RECIPIENT_CUST",
                  label: "Internal ID"
               })
            ]
         });
         var existingdunningEmail=[]
         var existingdunningContact=[]
         var existingdunningRecId=[];
         var salesRepdunning;
         var searchResultCount = customerSearchObj.runPaged().count;
         log.debug("customerSearchObj result count",searchResultCount);
         customerSearchObj.run().each(function(result){
          
            var dunningEmail=result.getValue({name:'custrecord_dl_recipient_email',join:'CUSTRECORD_3805_DUNNING_RECIPIENT_CUST'})
            var dunningContact=result.getValue({name:'custrecord_3805_dunning_recipient_cont',join:'CUSTRECORD_3805_DUNNING_RECIPIENT_CUST'})
            var dunningId=result.getValue({name:'internalid',join:'CUSTRECORD_3805_DUNNING_RECIPIENT_CUST'})
            var dunningLevel=result.getValue({name:'custrecord_dl_dunning_level_recipients',join:'CUSTRECORD_3805_DUNNING_RECIPIENT_CUST'})
            if(dunningLevel==repDunLevel)
            {
             salesRepdunning=dunningId
            }else{
                existingdunningRecId.push(dunningId)
                existingdunningEmail.push(dunningEmail);
                existingdunningContact.push(dunningContact);
            }
 
           
            return true;
         });
         var obj={
            "dunningEmail":existingdunningEmail,
            "dunningContact":existingdunningContact,
            "dunningRecId":existingdunningRecId,
            "salesRepdunning":salesRepdunning
         }

         return obj;
    }
    function createCustomerContacts(custEmails,custId,firstEmail)
    {

        var custContacts=[]

        var contactDetails=checkExistingContacts(custEmails,custId)
        var extistingContactEmails=contactDetails.contactEmailIds
        log.debug("extistingContactEmails",extistingContactEmails)

        for(var i=0;i<custEmails.length;i++)
        {
            var existingContactIndex=extistingContactEmails.indexOf(custEmails[i]);
            if(existingContactIndex===-1)
            {
        var contactRec = record.create({
            type: record.Type.CONTACT,
            isDynamic: true,
        });
        contactRec.setValue({
            fieldId:'entityid',
            value:custEmails[i]
        })
       
        contactRec.setValue({
            fieldId:'company',
            value:custId
        });
        contactRec.setValue({
            fieldId:'email',
            value:custEmails[i]
        });
        contactRec.setValue({
            fieldId:'custentity_ft_create_dunning_receipient',
            value:true
        });
        if(firstEmail==custEmails[i])
        {
            contactRec.setValue({
                fieldId:'custentity_ft_dunning_contact_category',
                value:2
            });

        }else{
            contactRec.setValue({
                fieldId:'custentity_ft_dunning_contact_category',
                value:3
            });
        }
        var id=contactRec.save();
        
        custContacts.push(id);
    }else{
        var existingContactId=contactDetails.contactIds[existingContactIndex];
        log.debug("existingContactId",existingContactId)
        var id = record.submitFields({
            type: record.Type.CONTACT,
            id: existingContactId,
            values: {
                'custentity_ft_create_dunning_receipient':true
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
            }
        });
        custContacts.push(existingContactId);
    }
    }
    log.debug("custContacts arr",custContacts)
    return custContacts;
    }
    function checkExistingContacts(custEmails,custId)
    {
        var contactSearchObj = search.create({
            type: "contact",
            filters:
            [
               ["customer.internalid","anyof",custId]
            ],
            columns:
            [
               search.createColumn({name: "entityid", label: "Name"}),
               search.createColumn({name: "internalid", label: "Internal id"}),
               search.createColumn({name: "email", label: "Email"}),             
               search.createColumn({name: "company", label: "Company"}),             
            ]
         });
         var searchResultCount = contactSearchObj.runPaged().count;
         log.debug("contactSearchObj result count",searchResultCount);
         var contactEmailIds=[]
         var contactIds=[];
         contactSearchObj.run().each(function(result){
            var emailId=result.getValue({name:'email'});
            var contId=result.getValue({name:'internalid'});
            contactEmailIds.push(emailId);
            contactIds.push(contId);
            return true;
         });
         return {"contactEmailIds":contactEmailIds,"contactIds":contactIds}
         
        
    }

    function findSalesRepContact(salesRepEmail)
    {
        var contactSearchObj = search.create({
            type: "contact",
            filters:
            [
                ["email","is",salesRepEmail]
            ],
            columns:
            [
               search.createColumn({name: "internalid", label: "Internal ID"}),
               search.createColumn({name: "entityid", label: "Name"}),
               search.createColumn({name: "email", label: "Email"})
            ]
         });
         var searchResultCount = contactSearchObj.runPaged().count;
         log.debug("contactSearchObj result count",searchResultCount);
         var salesRepContactId;
         contactSearchObj.run().each(function(result){
            salesRepContactId=result.getValue({name:'internalid'})
         });
       log.debug("salesRepContactId",salesRepContactId)
       return salesRepContactId;
    }

    function createDunningRec(custContact,salesRepContact,custId)
    {
        for(var i=0;i<custContact.length;i++){
        var dunningRec = record.create({
            type: 'customrecord_3805_dunning_recipient',
            isDynamic: true,            
        }); 
        dunningRec.setValue({
            fieldId:'custrecord_3805_dunning_recipient_cust',
            value:custId
        })
        dunningRec.setValue({
            fieldId:'custrecord_3805_dunning_recipient_cont',
            value:custContact[i]
        })
        dunningRec.setValue({
            fieldId:'custrecord_dl_dunning_level_recipients',
            value:1
        })
        dunningRec.save();
        }
    if(salesRepContact)
    {
        var dunningRec = record.create({
            type: 'customrecord_3805_dunning_recipient',
            isDynamic: true,            
        }); 
        dunningRec.setValue({
            fieldId:'custrecord_3805_dunning_recipient_cust',
            value:custId
        })
        dunningRec.setValue({
            fieldId:'custrecord_3805_dunning_recipient_cont',
            value:salesRepContact
        })
        dunningRec.setValue({
            fieldId:'custrecord_dl_dunning_level_recipients',
            value:3
        })
        var dunRecId=dunningRec.save();
    }
    var id = record.submitFields({
        type: record.Type.CUSTOMER,
        id: custId,
        values: {
            'custentity_ft_dunning_rec_update_date': new Date(),
            'custentity_ft_dunning_rec_aut_error':''
        },
        options: {
            enableSourcing: false,
            ignoreMandatoryFields : true
        }
    });
    log.debug("after datebtime set",id);
    return dunRecId;
    }

    function checkDunningForUpdate(dunningDetails,custEmails,custId,firstEmail)
    {
        var removeDunning=[];
        var addDunning=[];
        var dunningEmails=dunningDetails.dunningEmail;
        var contactId;
        var contactArr=[]
        log.debug("dunningEmails",dunningEmails)

        for(var i=0;i<custEmails.length;i++)
        {
            log.debug("entry to custEmails")

            var emailIdIndex=dunningEmails.indexOf(custEmails[i]);
            log.debug("emailIdIndex",emailIdIndex)
            if(emailIdIndex===-1)
            {
                addDunning.push(custEmails[i])
                contactId=updateContactRec(custEmails[i],'add',custId,emailIdIndex,dunningDetails,firstEmail);
                log.debug("contactId 1",contactId)
                contactArr.push(contactId)
            }
        }
        for(var i=0;i<dunningEmails.length;i++)
            {
                log.debug("entry to dunningEmails llop",dunningEmails[i])
                log.debug("custEmails.indexOf(dunningEmails[i])",custEmails.indexOf(dunningEmails[i]))

                if(custEmails.indexOf(dunningEmails[i])===-1)
                    {
                        removeDunning.push(custEmails[i])
                        contactId=updateContactRec(custEmails[i],'remove',custId,i,dunningDetails,firstEmail)
                        contactArr.push(contactId)

                    }
            }

            log.debug("contactArr",contactArr)
            return contactArr;

    }

    function updateContactRec(contactEmail,action,custId,index,dunningDetails,firstEmail)
    {
        log.debug("updateContactRec",action+","+index)
      var customerContacts=[];
      var contactId;
      var contactEmailIds=[contactEmail]
      log.debug("action",action)

       if(action=='add')
       {
        log.debug("action add")

        customerContacts =createCustomerContacts(contactEmailIds,custId,firstEmail)
        contactId=customerContacts[0]
       }else if(action=='remove')
       {
        log.debug("action remove")

        contactId=dunningDetails.dunningContact[index];
        log.debug("contactId")

        var contactId = record.submitFields({
            type: record.Type.CONTACT,
            id: contactId,
            values: {
                "custentity_ft_create_dunning_receipient": false
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
            }
        });
       
       }
       log.debug("contactId 3",contactId)

       return contactId;
    }
    function updateDunningRec(customerContacts,dunningDetails,salesRepContact,custId)
    {
        var contactSearchObj = search.create({
            type: "contact",
            filters:
            [
               ["internalid","anyof",customerContacts]
            ],
            columns:
            [
               search.createColumn({name: "entityid", label: "Name"}),
               search.createColumn({name: "internalid", label: "Internal ID"}),
               search.createColumn({name: "custentity_ft_create_dunning_receipient", label: "Create Dunning Recipient"})
            ]
         });
         var updatedContacts=[];
         var searchResultCount = contactSearchObj.runPaged().count;
         log.debug("contactSearchObj result count",searchResultCount);
         var contDunningRecCreate=[]
         contactSearchObj.run().each(function(result){
            var createDunning=result.getValue({name:'custentity_ft_create_dunning_receipient'});
            var contactId=result.getValue({name:'internalid'});
            log.debug("createDunning",createDunning)
            log.debug("contactId",contactId)
            
            if(createDunning)
            {
                contDunningRecCreate.push(contactId)
               
            }else{
                var index=dunningDetails.dunningContact.indexOf(contactId)
                log.debug("index",index)

                var dunningId=dunningDetails.dunningRecId[index];
                log.debug("dunningId",dunningId)
                if(dunningId)
                {
                    var id = record.submitFields({
                        type: 'customrecord_3805_dunning_recipient',
                        id: dunningId,
                        values: {
                            'inactive': true,
                            'custrecord_3805_dunning_recipient_cust':''
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });
                    log.debug("id",id)
                    updatedContacts.push(id);
                }

              }
            return true;
         });
         if(contDunningRecCreate.length>0)
         {
          salesRepContact='';
         createDunningRec(contDunningRecCreate,salesRepContact,custId)
         
         }
         if(updatedContacts.length>0)
         {
            var id = record.submitFields({
                type: record.Type.CUSTOMER,
                id: custId,
                values: {
                    'custentity_ft_dunning_rec_update_date': new Date(),
                    'custentity_ft_dunning_rec_aut_error':''
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            log.debug("after datebtime set remove",id);
         }

    }
    function updateRepDunningRecepient(salesRepContact,dunningDetails,custId,rep)
    {
        log.debug(".salesRepContact sale",salesRepContact)
        var scriptObj = runtime.getCurrentScript();
        var selfServ=scriptObj.getParameter({name: 'custscript_ft_script_self_service'})
        log.debug("dunningDetails.salesRepdunning sale",dunningDetails.salesRepdunning)

        var index= dunningDetails.dunningContact.indexOf(salesRepContact);
        log.debug("index sale",index)
        var dunningRecId=dunningDetails.salesRepdunning;
        log.debug("dunningRecId sale",dunningRecId)
        var dunRecId;
        if(dunningRecId &&rep!=selfServ && salesRepContact!=null)
        {
            log.debug("111")

        var dunningRec = record.load({
            type: 'customrecord_3805_dunning_recipient',
            id:dunningRecId
        }); 
     
        dunningRec.setValue({
            fieldId:'custrecord_3805_dunning_recipient_cont',
            value:salesRepContact
        })
        
        dunRecId=dunningRec.save();
     }else if(rep!=selfServ&&salesRepContact!=null){
        log.debug("22")

        dunRecId=createDunningRec([],salesRepContact,custId)
     }
     if(rep==selfServ||salesRepContact==null)
        {
            log.debug("rep blank",salesRepContact)

            if(dunningRecId)
            {
                dunRecId= record.submitFields({
                    type: 'customrecord_3805_dunning_recipient',
                    id: dunningRecId,
                    values: {
                        'inactive': true,
                        'custrecord_3805_dunning_recipient_cust':''
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
            }

          }
     log.audit("Updated dunRecId",dunRecId)
     if(dunRecId)
     {
        //Loading customer record and updating so that the UE script to update field custentity_ft_dunning_rep_dunning_rec_cr works fine.
        var custRec = record.load({
            type: record.Type.CUSTOMER,
            id:custId
        }); 
     
        custRec.setValue({
            fieldId:'custentity_ft_dunning_rep_dunning_rec_cr',
            value:false
        })

        custRec.setValue({
            fieldId:'custentity_ft_dunning_rec_aut_error',
            value:''
        })

        custRec.setValue({
            fieldId:'custentity_ft_dunning_rec_update_date',
            value:new Date()
        })
        
        var custId=custRec.save();
  
     }

    }

    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    };
    
});
