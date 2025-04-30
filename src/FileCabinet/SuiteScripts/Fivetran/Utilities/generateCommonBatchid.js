function preSavePage(options) {
    // Generate a single batch ID for all records
    const batchNumber = Math.floor(Math.random() * 9000000000 + 1000000000); // Ensures 10-digit number
    const varBatchId = `Celigo_${batchNumber}`;
    
    // Construct the transformed object
    const transformedData = {
      var_batch_id: varBatchId,
      flow_name: "Celigo flow",
      checksum: options.data.length, // Counting the number of transactions
      transaction: options.data.map(record => ({ ...record, var_batch_id: varBatchId })) // Insert varBatchId into each transaction
    };
  
    return {
      data: [transformedData],
      errors: options.errors,
      abort: false,
      newErrorsAndRetryData: []
    };
  }
  