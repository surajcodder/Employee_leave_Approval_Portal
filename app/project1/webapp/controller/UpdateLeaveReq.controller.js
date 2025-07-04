sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.UpdateLeaveReq", {


onInit: function () {
    debugger
    // const oRouter = this.getOwnerComponent().getRouter();
    // oRouter.getRoute("UpdateLeaveReq").attachPatternMatched(this._onRouteMatched, this);
},

_onRouteMatched: function (oEvent) {
    const sPath = decodeURIComponent(oEvent.getParameter("arguments").leavePath);
    this.getView().bindElement({ path: sPath });
},

onSave: function () {
    this.getView().getModel().submitChanges({
        success: () => sap.m.MessageToast.show("Leave Request Updated"),
        error: () => sap.m.MessageBox.error("Update failed")
    });
},

onCancel: function () {
    this.getOwnerComponent().getRouter().navTo("LeaveRequestList");
}
        
});
});