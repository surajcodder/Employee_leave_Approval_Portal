sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit: function () {
            debugger;

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("View1").attachPatternMatched(this._onRouteMatched, this);

            // Prepare userModel
            let oUserModel = this.getOwnerComponent().getModel("userModel");
            if (!oUserModel) {
                oUserModel = new sap.ui.model.json.JSONModel();
                this.getOwnerComponent().setModel(oUserModel, "userModel");
            }

            // Fetch from FLP user info service
            try {
                const oUserInfo = new sap.ushell.services.UserInfo();
                const sEmail = oUserInfo.getEmail();
                const sFirstName = oUserInfo.getFirstName();

                oUserModel.setData({
                    username: sFirstName,     // for old references
                    email: sEmail,
                    firstName: sFirstName,    // optional
                    employeeName: sFirstName  // 👈 used in your title binding
                });
            } catch (e) {
                sap.m.MessageToast.show("User info not available. Please login again.");
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

            var oModel = this.getOwnerComponent().getModel();
            if (oModel) {
                this._loadLeaveSummary(oModel);
            }
            var oVizFrame = this.byId("idLeaveChart");

            var oVizFrame = this.byId("idLeaveChart");

            oVizFrame.setVizProperties({
                plotArea: {
                    colorPalette: null, // disable semantic palette
                    dataPointStyle: {
                        rules: [
                            { dataContext: { Status: "Approved" }, properties: { color: "#2ecc71" } }, // green
                            { dataContext: { Status: "Pending" }, properties: { color: "#e67e22" } },  // orange
                            { dataContext: { Status: "Rejected" }, properties: { color: "#e74c3c" } }  // red
                        ],
                        others: { properties: { color: "#95a5a6" } } // grey fallback
                    }
                },
                legend: { visible: true, title: { visible: false } },
                title: { visible: true }
            });
        },

        _loadLeaveSummary: function () {
            var oModel = this.getView().getModel(); // V4 ODataModel

            // Create a ListBinding to the entity set
            var oBinding = oModel.bindList("/LeaveRequest");

            oBinding.requestContexts().then(function (aContexts) {
                var mSummary = {};

                aContexts.forEach(function (oContext) {
                    var oLeave = oContext.getObject(); // V4: context object
                    var sStatus = oLeave.status;

                    if (!mSummary[sStatus]) {
                        mSummary[sStatus] = 0;
                    }
                    mSummary[sStatus]++;
                });

                var aSummaryData = Object.keys(mSummary).map(function (sKey) {
                    return { status: sKey, count: mSummary[sKey] };
                });

                var total = 0,
                    approved = 0,
                    pending = 0,
                    rejected = 0;

                aSummaryData.forEach(function (item) {
                    total += item.count;
                    if (item.status === "Approved") {
                        approved = item.count;
                    } else if (item.status === "Pending") {
                        pending = item.count;
                    } else if (item.status === "Rejected") {
                        rejected = item.count;
                    }
                });

                // Build model with totals + percentages
                var oSummaryModel = new sap.ui.model.json.JSONModel({
                    LeaveSummary: aSummaryData,
                    Totals: {
                        total: total,
                        approved: approved,
                        pending: pending,
                        rejected: rejected,
                        approvedPct: total ? Math.round((approved / total) * 100) : 0,
                        pendingPct: total ? Math.round((pending / total) * 100) : 0,
                        rejectedPct: total ? Math.round((rejected / total) * 100) : 0
                    }
                });

                this.getView().setModel(oSummaryModel, "summaryModel");

            }.bind(this)).catch(function (oError) {
                sap.m.MessageToast.show("Failed to fetch leave requests.");
                console.error(oError);
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

            // 🔄 force chart refresh
            
            debugger
        },
        onViewLeave: function (oEvent) {
            const sId = oEvent.getSource().getParent().getParent().getBindingContext().getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("LeaveReqDetailed", { ID: sId });
        },

        // onEditLeave: function (oEvent) {
        //     const sId = oEvent.getSource().getParent().getParent().getBindingContext().getProperty("ID");
        //     this.getOwnerComponent().getRouter().navTo("UpdateLeaveReq", { ID: sId });
        // },

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
                                oModel.refresh(); // refresh table

                                // 🔄 Recalculate chart summary
                                this._loadLeaveSummary(oModel);

                            }.bind(this), // ✅ bind 'this' to access controller methods
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