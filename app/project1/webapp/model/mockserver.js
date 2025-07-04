sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/thirdparty/sinon",
    "require",
    "sap/base/util/uid"
], function (ManagedObject, sinon, require, uid) {
    "use strict";

    return ManagedObject.extend("project1.model.mockserver", {
        started: null,
        oModel: null,
        server: null,

        init: function () {},

        _updateModelWithData: function (oResponse, oExistingModelDataToUpdate, sMode, oFile, sUrl, oData) {
            switch (sMode) {
                case "Create":
                    this.oModel.getProperty("/items").unshift({
                        id: oResponse.id || uid(),
                        fileName: oResponse.fileName,
                        mediaType: oResponse.fileType,
                        url: oResponse.fileUrl,
                        uploadState: "Complete",
                        revision: "00",
                        status: "In work",
                        fileSize: oResponse.fileSize,
                        lastModifiedBy: "Jane Burns",
                        lastmodified: "10/03/21, 10:03:00 PM",
                        documentType: oResponse.documentType || "Invoice"
                    });
                    break;

                case "update":
                    if (oExistingModelDataToUpdate) {
                        oExistingModelDataToUpdate.fileName = oFile?.name || "";
                        oExistingModelDataToUpdate.url = sUrl;
                        oExistingModelDataToUpdate.fileSize = oFile?.size || 0;
                        oExistingModelDataToUpdate.mediaType = oFile?.type || "";
                        this.oModel.setData(oData);
                    }
                    break;
            }
        },

        start: function () {
            debugger
            const that = this;
            debugger

            this.server = sinon.fakeServer.create();
            debugger
            this.server.autoRespond = true;
            this.server.xhr.useFilters = true;

            this.server.xhr.addFilter(function (method, url) {
                return !url.match(/\/uploadFiles/);
            });

            // Upload or Update
            this.server.respondWith("POST", RegExp("/uploadFiles", "i"), function (xhr) {
                const oFile = xhr.requestBody || null;
                const requestHeaders = xhr.requestHeaders || {};
                const existingId = requestHeaders["existingDocumentID"];
                const data = that.oModel?.getData() || {};
                const existingItem = data.items?.find(item => item.id === existingId) || null;

                const url = requestHeaders.documentUrl || URL.createObjectURL(oFile);
                let fileId = uid().split("-")[1];

                const oResponse = {
                    id: fileId,
                    fileName: oFile?.name || "",
                    fileUrl: url,
                    fileSize: oFile?.size || 0,
                    fileType: oFile?.type || "",
                    documentType: requestHeaders.documentType || null
                };

                if (!existingItem) {
                    that._updateModelWithData(oResponse, null, "Create", oFile, url, data);
                } else {
                    that._updateModelWithData(oResponse, existingItem, "update", oFile, url, data);
                }

                xhr.respond(201, { "Content-Type": "application/json" }, JSON.stringify(oResponse));
            });

            // Delete
            this.server.respondWith("DELETE", RegExp("/uploadFiles/.*", "i"), function (xhr) {
                const parts = xhr.url.split("/");
                const deleteId = parts[parts.length - 1];
                const data = that.oModel.getData();

                data.items = data.items.filter(item => item.id !== deleteId);
                that.oModel.setData(data);

                xhr.respond(204, {}, "");
            });
        },

        restore: function () {
            this.server.restore();
        },

        updateExisitingDocument: function (oFileObject) {
            const items = this.oModel.getProperty("/items");
            const fileToUpdate = items.find(item => item.id === oFileObject.id);
            if (fileToUpdate) {
                fileToUpdate.fileName = oFileObject.fileName;
                fileToUpdate.url = oFileObject.url;
                fileToUpdate.fileSize = oFileObject.fileSize;
                fileToUpdate.mediaType = oFileObject.mediaType;
                this.oModel.setData({ items });
            }
        }
    });
});
