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
