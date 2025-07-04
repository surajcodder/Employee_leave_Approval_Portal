const { Console } = require("console");
const axios = require('axios');
const cds = require('@sap/cds');
module.exports = cds.service.impl(async function () {
  const { LeaveRequest, Files, Comments } = this.entities;

  this.on('addLeaveRequest', async (req) => {
    console.log("Received Leave Request:", req.data);

    const {
      employeeName, leaveType, startDate, endDate, reason, status,
      fileName, mediaType, fileSize
    } = req.data;

    // ✅ Insert the new Leave Request
    const [newLeave] = await INSERT.into(LeaveRequest).entries({
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
      status
    });
    const result = await SELECT.from(LeaveRequest).columns('ID').where({
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
      status
    });
    const foundID = result[0]?.ID;
    console.log("Fetched ID:", foundID);
    // 2️⃣ If file metadata is provided, create related file entry
    // if (fileName && mediaType && fileSize) {
    //   debugger
    //   await INSERT.into(Files).entries({
    //     fileName,
    //     mediaType,
    //     size: fileSize,
    //     leaveRequestID: foundID,
    //     content: Buffer.from(req.data.content, 'base64'),  // convert base64 to binary
    //   });
    // }


    // ✅ Trigger Workflow after insertion
    // const workflowContent = JSON.stringify({
    //     "definitionId": "us10.ede812adtrial.leaveapproval.process1",
    //     "context": {
    //         "leavetype": leaveType,
    //         "startdate": startDate,
    //         "enddate": endDate,
    //         "reason": reason,
    //         "status": status,
    //         "customername": employeeName,
    //         "id": foundID

    // }
    // });

    // const token = await generateToken();
    // const authHeader = `Bearer ${token}`;

    // try {
    //   const result = await axios.post(
    //     'https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/workflow/rest/v1/workflow-instances',
    //     workflowContent,
    //     {
    //       headers: {
    //         "Accept-Language": "en",
    //         "DataServiceVersion": "2.0",
    //         "Accept": "application/json",
    //         "Content-Type": "application/json",
    //         "Authorization": authHeader
    //       }
    //     }
    //   );
    //   console.log("Workflow triggered successfully.");
    // } catch (error) {
    //   console.error("Workflow trigger failed:", error.response?.data || error.message);
    //   // optionally handle failure here (e.g., log to DB or notify)
    // }

    return newLeave;
  });


  this.on('addCommentToLeave', async (req) => {
    debugger;

    let { leaveRequestID, commentsText, user } = req.data;

    // 🔍 Remove leading/trailing quotes if present
    if (commentsText?.startsWith("'") && commentsText?.endsWith("'")) {
      commentsText = commentsText.slice(1, -1);
    }
  
    if (!leaveRequestID || !commentsText || !user) {
      return req.error(400, "Missing required fields.");
    }
  
    const leaveData = await SELECT.one.from(LeaveRequest).where({ ID: leaveRequestID });
    if (!leaveData) return req.error(404, "LeaveRequest not found.");
  
    const [newComment] = await INSERT.into(Comments).entries({
      commentsText,
      user,
      leaveRequest_ID: leaveRequestID,
      createdAt: new Date()
    });
  
    return newComment.ID;
  });





  this.on('addFileToLeave', async (req) => {
    debugger
    const { leaveID, fileName, mediaType, size, content } = req.data;



    // 📝 Insert file metadata linked to the draft leave
    const [newFile] = await INSERT.into(Files).entries({
      fileName,
      mediaType,
      size,
      leaveRequestID: leaveID, // this is the association field
      content
    });

    console.log("File metadata added to draft leave:", newFile);
    const leaveData = await SELECT.one.from(LeaveRequest).where({ ID: leaveID });

    if (!leaveData) {
      console.error("❌ LeaveRequest not found for ID:", leaveID);
      return;
    }

    // 🧩 Compose file JSON string to pass in workflow "file" field
    const fileString = JSON.stringify({
      fileName,
      mediaType,
      size,
      content
    });

    const commentEntries = await SELECT.from(Comments).where({ leaveRequest_ID: leaveID });

    // 🎯 JSON.stringify the entire comments array
    const formattedComments = JSON.stringify(commentEntries);
    debugger
    // ✅ Trigger Workflow after insertion
    const workflowContent = JSON.stringify({
      "definitionId": "us10.ede812adtrial.leaveapproval.process1",
      "context": {
        "leavetype": leaveData.leaveType,
        "startdate": leaveData.startDate,
        "enddate": leaveData.endDate,
        "reason": leaveData.reason,
        "status": leaveData.status,
        "customername": leaveData.employeeName,
        "id": leaveID,
        "file": fileString,
        "comments": formattedComments


      }
    });

    const token = await generateToken();
    const authHeader = `Bearer ${token}`;

    try {
      const result = await axios.post(
        'https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/workflow/rest/v1/workflow-instances',
        workflowContent,
        {
          headers: {
            "Accept-Language": "en",
            "DataServiceVersion": "2.0",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": authHeader
          }
        }
      );
      console.log("Workflow triggered successfully.");
    } catch (error) {
      console.error("Workflow trigger failed:", error.response?.data || error.message);
      // optionally handle failure here (e.g., log to DB or notify)
    }

    // ✅ Return the generated file ID for binary upload
    return newFile.ID;
  });




  // 🔐 Token generator
  async function generateToken() {
    const tokenUrl = 'https://ede812adtrial.authentication.us10.hana.ondemand.com/oauth/token';
    const clientId = 'sb-483f0a4c-51a3-4436-b113-323a0c2274fa!b465767|xsuaa!b49390';
    const clientSecret = '09d97686-d256-47b8-8505-0f73a02d7d28$eH219GON_miuCUwxGm0Pl4eiMEN6Obp5Brd-jIVVMlo=';

    try {
      const response = await axios.post(tokenUrl, null, {
        params: {
          grant_type: 'client_credentials'
        },
        auth: {
          username: clientId,
          password: clientSecret
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error generating token:', error.response?.data || error.message);
    }
  }
});
