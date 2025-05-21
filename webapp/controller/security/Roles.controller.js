sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.Roles", {
    onInit: function () {
      // Modelo de estado para mostrar/ocultar el detalle
      const oModel = new JSONModel({ isDetailVisible: false });
      this.getView().setModel(oModel, "uiState");

      // Hook del enrutador
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteRoles").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      const oRolesMaster = this.byId("rolesMasterView");
      const oController = oRolesMaster.getController();

      if (oController && typeof oController.loadRolesData === "function") {
        oController.loadRolesData(); // Ejecuta get all al acceder
      }

      const oUiStateModel = this.getView().getModel("uiState");
      if (oUiStateModel) {
        oUiStateModel.setProperty("/isDetailVisible", false);
      }

      this.getOwnerComponent().setModel(new JSONModel({}), "selectedRole");

    }
  });
});
