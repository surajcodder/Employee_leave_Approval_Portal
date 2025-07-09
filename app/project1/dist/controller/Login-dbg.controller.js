sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast"], function (Controller, MessageToast) {
    "use strict";
    return Controller.extend("project1.controller.Login", {
        onLogin: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            const sUser = this.byId("usernameInput").getValue();
            const sPass = this.byId("passwordInput").getValue();
        
            if (sUser === "John" && sPass === "John") {
                MessageToast.show("Login successful");
        
                // ✅ Store full user data (customize this as needed)
                const oUserData = {
                    username: sUser,      // ✅ Dynamic
                    role: "Admin",        // You can also customize this per user
                    employeeName: sUser
                };
        
                // ✅ Persist user data
                localStorage.setItem("userData", JSON.stringify(oUserData));
        
                // ✅ Set userModel with the full data
                const oUserModel = new sap.ui.model.json.JSONModel(oUserData);
                this.getOwnerComponent().setModel(oUserModel, "userModel");
        
                // ✅ Navigate to home/dashboard view
                oRouter.navTo("View1");
            } else {
                MessageToast.show("Invalid credentials");
            }
        }
    })        
});
