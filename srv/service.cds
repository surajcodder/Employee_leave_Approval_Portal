using db from '../db/schema';

service MyService {
  entity Comments     as projection on db.Comments;

  @odata.draft.enabled  @odata.draft.bypass
  entity LeaveRequest as projection on db.LeaveRequest;

  entity Files        as projection on db.Files;


  function addLeaveRequest(employeeName : String(100),
                           leaveType : String(50),
                           startDate : Date,
                           endDate : Date,
                           reason : String(250),
                           status : String(20) // 'Pending' or predefined
  )                                              returns LeaveRequest;


  function addFileToLeave(leaveID : UUID,
                          fileName : String,
                          mediaType : String,
                          size : Integer,
                          content : LargeString) returns UUID;


  function addCommentToLeave(leaveRequestID : UUID,
                             commentsText : String(1000),
                             user : String(20))  returns UUID;


}
