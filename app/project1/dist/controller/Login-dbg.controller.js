sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast"], function (Controller, MessageToast) {
    "use strict";
    var oUserEmail;
    var oUserFName;
    return Controller.extend("project1.controller.Login", {
        onInit: function () {
            debugger
            var oUserdata = new sap.ushell.services.UserInfo().getEmail();
            oUserEmail = oUserdata;
            oUserFName = new sap.ushell.services.UserInfo().getFirstName();
            var oUserModel = new sap.ui.model.json.JSONModel({
                email: oUserEmail,
                firstName: oUserFName
            });

            // ✅ Set model at Component level so all views can access it
            this.getOwnerComponent().setModel(oUserModel, "userModel");

            let iProgress = 0;
            const oProgressBar = this.byId("progressBar");

            const interval = setInterval(() => {
                iProgress += 10;
                oProgressBar.setPercentValue(iProgress);
                oProgressBar.setDisplayValue(iProgress + "% Loaded");

                if (iProgress >= 100) {
                    clearInterval(interval);

                    // After loading, navigate to next view
                    const oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("View1");
                }
            }, 300); // every 0.3 sec
        }
    })
});
