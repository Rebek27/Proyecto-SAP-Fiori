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
      oRouter.getRoute("RouteRoles").attachPatternMatched(this.onRouteMatched, this);
    },

    onRouteMatched: async function () {
      const oRolesMaster = this.byId("rolesMasterView");
      const oController = oRolesMaster.getController();

      if (!oController) return;

      // Cargar roles desde backend
      if (typeof oController.loadRolesData === "function") {
        oController.loadRolesData();
      }

      // Cargar catálogos directamente
      if (typeof oController.loadCatalog === "function") {
        await oController.loadCatalog("IdPrivileges", "privilegeCatalogModel");
        await oController.loadCatalog("IdApplications", "allApplications");
        await oController.loadCatalog("IdViews", "allViews");
        await oController.loadCatalog("IdProcesses", "allProcesses");

        // Modelos filtrados vacíos para vistas y procesos
        oController.initFilteredCatalogModels();
      }

      // Ocultar el panel derecho
      const oUiStateModel = this.getView().getModel("uiState");
      if (oUiStateModel) {
        oUiStateModel.setProperty("/isDetailVisible", false);
      }

      // Limpiar rol seleccionado
      this.getOwnerComponent().setModel(new JSONModel({}), "selectedRole");
    }
  });
});
