sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (BaseController, JSONModel, Log, MessageToast, MessageBox, Fragment) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesDetail", {

    onInit: async function () {
      await this.loadCatalogsOnce();

    },


    _onRouteMatched: function (oEvent) {
      const sRoleId = decodeURIComponent(oEvent.getParameter("arguments").roleId);

      const oModel = this.getOwnerComponent().getModel("roles");
      if (!oModel) {
        MessageToast.show("Modelo de roles no disponible.");
        return;
      }

      const aRoles = oModel.getProperty("/value");
      const oRole = aRoles.find(role => role.ROLEID === sRoleId);

      if (!oRole) {
        MessageToast.show("Rol no encontrado.");
        return;
      }

      const oSelectedModel = new JSONModel(oRole);
      this.getView().setModel(oSelectedModel, "selectedRole");
    },


   onGoToUsers: function () {
      this.getOwnerComponent().getRouter().navTo("RouteUsersList");
    },
    
    onGotoCatalogs: function(){
      this.getOwnerComponent().getRouter().navTo("RouteCatalogs");
    },
    
  
   
 
  });
});
