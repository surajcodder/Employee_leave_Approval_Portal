// ✅ FIXED: UploadSet file content issue in table mode

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    async function getFileContentFromUploadSet(fileName, aFilesFromModel) {
        for (const fileEntry of aFilesFromModel) {
            if (fileEntry.fileName === fileName && fileEntry.fileObject) {
                return await fileEntry.fileObject.arrayBuffer(); // ✅ binary
            }
        }
        return null;
    }


    return Controller.extend("project1.controller.LeaveReqObject", {
        onInit: function () {
            const oDocModel = new JSONModel({ items: [] });
            this.getView().setModel(oDocModel, "documents");
            // this.getOwnerComponent().setModel(oUserModel, "userModel");
            const oCommentModel = new sap.ui.model.json.JSONModel({
                comment: ""
            });
            this.getView().setModel(oCommentModel, "commentModel");
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("LeaveReqObject").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function () {
            const oStartDatePicker = this.byId("inputStartDate");
            const oEndDatePicker = this.byId("inputEndDate");

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            oStartDatePicker.setMinDate(today);

            // Optional: clear old values if needed
            oStartDatePicker.setValue("");
            oEndDatePicker.setValue("");
            oEndDatePicker.setMinDate(null); // reset minDate until startDate is picked
        },


        onStartDateChange: function (oEvent) {
            const oStartDate = oEvent.getSource().getDateValue(); // get JS Date object
            if (!oStartDate) return;

            // Add 1 day to start date
            const oMinEndDate = new Date(oStartDate);
            oMinEndDate.setDate(oMinEndDate.getDate() + 1);

            const oEndDatePicker = this.byId("inputEndDate");
            oEndDatePicker.setMinDate(oMinEndDate);

            // Optional: clear end date if it’s earlier than new min date
            const oEndDate = oEndDatePicker.getDateValue();
            if (oEndDate && oEndDate < oMinEndDate) {
                oEndDatePicker.setDateValue(null);
            }
        },

        onBeforeUploadStarts: async function (oEvent) {
            const oItem = oEvent.getParameter("item");
            const oFile = await oItem.getFileObject?.();

            if (!oFile) {
                MessageToast.show("No file selected.");
                return;
            }

            const base64 = await this.fileToBase64(oFile); // ✅ convert content

            const oModel = this.getView().getModel("documents");
            const aItems = oModel.getProperty("/items") || [];

            aItems.push({
                fileName: oFile.name,
                mediaType: oFile.type,
                fileSize: oFile.size,
                fileObject: oFile,
                content: base64,     // ✅ THIS is what was missing earlier
                ID: null             // Will be filled later after backend save
            });

            oModel.setProperty("/items", aItems);
            oEvent.preventDefault(); // ✅ prevent native upload
            MessageToast.show("File stored locally.");
        },


        fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(",")[1]; // remove "data:*/*;base64,"
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },



        onCreate: async function () {
            debugger


            const oView = this.getView();
            const oModel = this.getOwnerComponent().getModel();
            const baseUrl = oModel.getServiceUrl();

            const employeeName = oView.byId("inputEmployeeName").getValue();
            const leaveType = oView.byId("inputLeaveType").getSelectedItem()?.getText();
            const startDate = oView.byId("inputStartDate").getValue();
            const endDate = oView.byId("inputEndDate").getValue();
            const reason = oView.byId("inputReason").getValue();
            const status = oView.byId("inputStatus").getValue() || "Pending";

            if (!employeeName || !leaveType || !startDate || !endDate) {
                MessageToast.show("Please fill in all required fields.");
                return;
            }

            const oDocModel = oView.getModel("documents");
            const aFiles = oDocModel.getProperty("/items") || [];
            const fileMeta = aFiles[0];

            try {
                const oFunction = oModel.bindContext("/addLeaveRequest(...)");
                oFunction
                    .setParameter("employeeName", employeeName)
                    .setParameter("leaveType", leaveType)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("reason", reason)
                    .setParameter("status", status);

                await oFunction.execute();
                const result = await oFunction.getBoundContext().requestObject();
                const leaveID = result.ID;

                const fileMeta = aFiles[0];
                await this.postComment(leaveID); // ✅ Save the comment here

                if (fileMeta && fileMeta.fileObject) {
                    const base64Content = await this.fileToBase64(fileMeta.fileObject); // ✅ fixed call
                    const addFileFn = oModel.bindContext("/addFileToLeave(...)");

                    addFileFn.setParameter("leaveID", leaveID);
                    addFileFn.setParameter("fileName", fileMeta.fileName);
                    addFileFn.setParameter("mediaType", fileMeta.mediaType);
                    addFileFn.setParameter("size", fileMeta.fileSize);
                    addFileFn.setParameter("content", base64Content); // ✅ base64 string
                   

                    await addFileFn.execute();
                }
                debugger


                MessageToast.show("Leave request submitted with file and comment.");
                this.onCancel();

                MessageToast.show("Leave request submitted with file.");
                debugger

                debugger
                this.onCancel();
            } catch (error) {
                console.error("Upload failed:", error);
                MessageToast.show("Leave request failed.");
            }
        },

        onCancel: function () {
            this.getOwnerComponent().getRouter().navTo("View1");
        },




        openPreview: async function (oEvent) {
            debugger
            const oContext = oEvent.getSource().getBindingContext("documents");
            const oDocData = oContext.getObject();
            const base64 = oDocData.content;
            const fileName = oDocData.fileName;
            const mediaType = oDocData.mediaType || "application/octet-stream";

            // Case 1: Preview from local model (unsaved)
            if (base64) {
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mediaType });

                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                return;
            }

            // Case 2: Preview from backend (already saved to DB)
            const fileID = oDocData.ID; // ensure this is populated during upload (if saved)
            if (!fileID) {
                MessageToast.show("File not yet saved. Please submit first.");
                return;
            }

            try {
                const oModel = this.getView().getModel();
                const baseUrl = oModel.getServiceUrl();
                const response = await fetch(`${baseUrl}Files(ID=${fileID},IsActiveEntity=true)`);
                const fileData = await response.json();

                if (!fileData.content) {
                    MessageToast.show("No content found in database.");
                    return;
                }

                const backendBase64 = fileData.content;
                const backendMediaType = fileData.mediaType || "application/octet-stream";

                const byteCharacters = atob(backendBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: backendMediaType });

                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
            } catch (error) {
                console.error("Preview failed:", error);
                MessageToast.show("Failed to load preview.");
            }
        },
        postComment: async function (leaveID) {
            debugger
            const oCommentModel = this.getView().getModel("commentModel");
            const sComment = oCommentModel.getProperty("/comment");

            if (!sComment) {
                return; // Skip if empty
            }

            try {
                const oModel = this.getView().getModel(); // OData model
                const baseUrl = oModel.getServiceUrl();
                const userData = JSON.parse(localStorage.getItem("userData")) || {};
                const username = userData.username || "anonymous";

                const payload = {
                    commentsText: sComment,
                    user: username,
                    leaveRequest_ID: leaveID
                };

                debugger
                const response = await fetch(`${baseUrl}Comments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                debugger

                if (!response.ok) {
                    throw new Error("Failed to post comment");
                }

                MessageToast.show("Comment saved.");
                oCommentModel.setProperty("/comment", ""); // Clear input
            } catch (error) {
                console.error("Comment creation failed:", error);
                MessageToast.show("Failed to save comment.");
            }
        },
        onRemoveHandler: function (oEvent) {
            debugger
            const oSource = oEvent.getSource(); // the ❌ button
            const oBindingContext = oSource.getBindingContext("documents");
            const oDeletedFile = oBindingContext.getObject();

            const oDocModel = this.getView().getModel("documents");
            let aItems = oDocModel.getProperty("/items");

            // Filter out the file to be removed
            const aFiltered = aItems.filter(file => file.fileName !== oDeletedFile.fileName);

            oDocModel.setProperty("/items", aFiltered);

            MessageToast.show(`Removed file: ${oDeletedFile.fileName}`);
        }





    });
});
