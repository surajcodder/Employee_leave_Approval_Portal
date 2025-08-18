sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.UpdateLeaveReq", {


        onInit: function () {
            debugger
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("UpdateLeaveReq").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {

            debugger;

            const sId = oEvent.getParameter("arguments").ID;
            if (!sId) {
                console.error("No ID passed to route.");
                return;
            }

            const oView = this.getView();
            const oModel = oView.getModel(); // This should be an OData V4 model

            // Bind the main LeaveRequest entity
            const sContextPath = `/LeaveRequest(ID='${sId}',IsActiveEntity=true)`;
            oView.bindElement({
                path: sContextPath,
                parameters: {},
                events: {
                    dataReceived: function (oEvent) {
                        const oData = oEvent.getParameter("data");
                        debugger
                        if (!oData) {
                            console.error("Leave request not found for ID:", sId);
                        }
                    }
                }
            });
            // ----- comments Section



            // --- Load files (attachments) manually using bindList ---
            const sFilePath = `${sContextPath}/files`;

            const oListBinding = oModel.bindList(sFilePath);

            oListBinding.requestContexts().then(function (aContexts) {
                debugger
                const aFiles = aContexts.map(oContext => oContext.getObject());
                oView.getModel("documents").setProperty("/items", aFiles);
            }).catch(function (oError) {
                console.error("Failed to load attachments:", oError);
                sap.m.MessageToast.show("Failed to load attachments.");
            });




            // ✅ Load comments
            const oCommentsBinding = oModel.bindList(`${sContextPath}/comments`);
            debugger
            oCommentsBinding.requestContexts().then(function (aContexts) {
                debugger
                if (aContexts.length > 0) {
                    // Pick latest or first comment (customize as needed)
                    const oComment = aContexts[0].getObject();
                    const oTextArea = oView.byId("commentInput");
                    if (oTextArea) {
                        oTextArea.setValue(oComment.commentsText || "");
                    }
                } else {
                    console.log("No comments found for this leave request.");
                }
            }).catch(function (oError) {
                console.error("Failed to load comments:", oError);
                sap.m.MessageToast.show("Failed to load comments.");
            });
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