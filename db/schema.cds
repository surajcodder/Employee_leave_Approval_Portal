namespace db;

using {
  cuid,
  managed
} from '@sap/cds/common';

// Value help entity for Leave Types
entity LeaveType {
  key code : String(10);
      name : String(50);
}

entity Login : cuid, managed {
  username : String(50);
  email    : String(100);
  password : String(256); // This will store the **hashed** password
  role     : String(30);
  status   : String(20);
}


// Leave Request Entity
// @odata.draft.bypass: true|
entity LeaveRequest : managed {
  key ID           : UUID;
      employeeName : String(100);
      // Dropdown field with value help from LeaveType
      leaveType    : String(50);
      startDate    : Date;
      endDate      : Date;
      reason       : String(250);
      status       : String(20) default 'Pending'; // Always "Pending" when created

      // For file attachments
      files        : Composition of many Files
                       on files.fileToLeave = $self;
      comments     : Composition of many Comments
                       on comments.leaveRequest = $self;
      businessobject: Composition of many MyBusinessObject on businessobject.leaveRequest = $self
}

// File Attachment Entity
@odata.draft.bypass
entity Files : cuid, managed {
  @Core.MediaType  : mediaType
  content                     : LargeString;

  @Core.IsMediaType: true
  mediaType                   : String;
  fileName                    : String;
  size                        : Integer;
  url @(cds.persistence.skip) : String;
  leaveRequestID              : UUID;

  fileToLeave                 : Association to one LeaveRequest
                                  on fileToLeave.ID = leaveRequestID;

}

// Comment Entity for each Leave Request
@odata.draft.enabled: false
entity Comments : cuid, managed {
  commentsText : String(1000); // The actual comment message
  user         : String(20); // 'C' for Customer, 'M' for Mahindra
  createdAt    : Timestamp; // Auto-filled by @managed
  leaveRequest : Association to LeaveRequest; // Foreign key relation
}

entity MyBusinessObject {
    key ID              : UUID;
    description         : String;
    status              : String;
    workflowInstanceId  : String; // store Workflow API "id"
    createdAt           : Timestamp;
    updatedAt           : Timestamp;

    // New: Foreign key to LeaveRequest
    leaveRequest_ID     : UUID;

    // New: Association to LeaveRequest
    leaveRequest        : Association to LeaveRequest
                            on leaveRequest.ID = leaveRequest_ID;
}