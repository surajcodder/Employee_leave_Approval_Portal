sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit: function () {
            debugger
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("View1").attachPatternMatched(this._onRouteMatched, this);
        
            // Check if userModel is already set, else try to load from localStorage
            let oUserModel = this.getOwnerComponent().getModel("userModel");
        
            if (!oUserModel) {
                oUserModel = new sap.ui.model.json.JSONModel();
                this.getOwnerComponent().setModel(oUserModel, "userModel");
            }
        
            if (!oUserModel.getData().username) {
                const sStoredUserData = localStorage.getItem("userData");
                if (sStoredUserData) {
                    oUserModel.setData(JSON.parse(sStoredUserData));
                }
            }
        
            // Still not found after trying to restore? Force login
            if (!oUserModel.getData().username) {
                sap.m.MessageToast.show("User not found. Please login again.");
                this.getOwnerComponent().getRouter().navTo("RouteLogin");
            }
        },
        

        _onRouteMatched: function () {
            const oTable = this.byId("leaveRequestTable");
            const oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh(); // ✅ This will reload the table data
            }
        },


        onAfterRendering: function () {
            debugger
            const oTable = this.byId("leaveRequestTable");
            const aItems = oTable.getItems();

            aItems.forEach((oItem) => {
                const oStatus = oItem.getCells()[4]; // 5th column = Status
                const statusText = oStatus.getText();

                if (statusText === "Approved") {
                    oStatus.addStyleClass("statusGreen");
                } else if (statusText === "Pending") {
                    oStatus.addStyleClass("statusOrange");
                } else if (statusText === "Cancel") {
                    oStatus.addStyleClass("statusRed");
                }
            });
        },
        onUpdate: function (oEvent) {
            debugger
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("UpdateLeaveReq"); // This should match the "name" in routes
            debugger
        },
        onCreate: function (oEvent) {
            debugger
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("LeaveReqObject"); // This should match the "name" in routes
            debugger
        },
        onViewLeave: function (oEvent) {
            const sId = oEvent.getSource().getParent().getParent().getBindingContext().getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("LeaveReqDetailed", { ID: sId });
        },

        onEditLeave: function (oEvent) {
            const sId = oEvent.getSource().getParent().getParent().getBindingContext().getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("UpdateLeaveReq", { ID: sId });
        },

        onDeleteLeave: function (oEvent) {
            debugger;
            var baseUrl = oEvent.oSource.getModel().getServiceUrl()
            const oContext = oEvent.getSource().getParent().getParent().getBindingContext();
            const oModel = this.getView().getModel();
            const sPath = oContext.getPath();

            MessageBox.confirm("Are you sure you want to delete this leave request?", {
                onClose: (sAction) => {
                    if (sAction === "OK") {
                        debugger
                        const oContext = oEvent.getSource().getParent().getParent().getBindingContext();
                        const sLeaveId = oContext.getProperty("ID"); // Adjust based on your key field
                        const sUrl = `LeaveRequest(ID=${sLeaveId},IsActiveEntity=true)`; // Adjust this path as needed
                        debugger
                        $.ajax({
                            url: baseUrl + sUrl,
                            type: "DELETE",
                            success: function () {
                                MessageToast.show("Leave request deleted.");
                                oModel.refresh(); // ✅ Refresh data to reflect deletion
                                debugger
                            },
                            error: function () {
                                MessageToast.show("Failed to delete leave request.");
                            }
                        });
                    }
                }
            });

        }


    });
});