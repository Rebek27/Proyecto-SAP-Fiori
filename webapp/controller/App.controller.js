/* eslint-disable linebreak-style */
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller)  {
  "use strict";

  return Controller.extend("com.invertions.sapfiorimodinv.controller.App", {
    onInit: function () {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteMain");
    },

    onToggleSideNav: function () {
      const oToolPage = this.byId("mainToolPage");
      oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
    },

    onUserPress: function () {
      // Aquí puedes abrir un diálogo de perfil, cerrar sesión, etc.
      sap.m.MessageToast.show("Usuario: Función aún no implementada");
    },

    onItemSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      const oRouter = this.getOwnerComponent().getRouter();

      switch (sKey) {
        case "salesforecast":
          oRouter.navTo("RouteSalesForecast");
          break;
        case "roles":
          oRouter.navTo("RouteRolesMaster");
          break;
        case "users":
          oRouter.navTo("RouteUsersList");
          break;
        default:
          oRouter.navTo("RouteMain");
      }
    }

  });
});