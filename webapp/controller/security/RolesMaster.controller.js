sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log"
], function (BaseController, JSONModel, Log) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesMaster", {
    onInit: function () {
      const oRolesModel = new JSONModel();
      this.getView().setModel(oRolesModel, "roles");

      const oSelectedRoleModel = new JSONModel();
      this.getView().setModel(oSelectedRoleModel, "selectedRole");

      this._loadRolesData();

      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteRolesMaster").attachPatternMatched(this._onRouteMatched, this);
    },

    _loadRolesData: async function () {
      try {
        const response = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all");
        const data = await response.json();

        // Filtrar roles activos y no eliminados
        const filteredRoles = data.value.filter(role =>
          role.DETAIL_ROW?.ACTIVED === true &&
          role.DETAIL_ROW?.DELETED === false
        );


        // Guardamos todo el array de roles
        this.getView().getModel("roles").setData({ value: filteredRoles });
      } catch (error) {
        Log.error("Error al cargar roles", error);
      }
    },


    onRolePress: function (oEvent) {
      const oListItem = oEvent.getParameter("listItem");
      const oContext = oListItem.getBindingContext("roles");


      if (!oContext) {
        console.error("No se encontró el contexto del rol seleccionado.");
        return;
      }

      const oSelectedRole = oContext.getObject();

      // ✅ Guardar el rol seleccionado en el modelo global 'selectedRole'
      const oSelectedRoleModel = new JSONModel(oSelectedRole);
      this.getOwnerComponent().setModel(oSelectedRoleModel, "selectedRole");

      // ✅ Navegar al detalle
      this.getOwnerComponent().getRouter().navTo("RouteRolesDetail", {
        roleId: encodeURIComponent(oSelectedRole.ROLEID)
      });
    },

    onMultiSearch: function () {
      const sQueryRole = this.byId("searchRoleName").getValue().toLowerCase();

      const oList = this.byId("rolesList");
      const oBinding = oList.getBinding("items");

      const aFilters = [];

      if (sQueryRole) {
        aFilters.push(new sap.ui.model.Filter("ROLENAME", sap.ui.model.FilterOperator.Contains, sQueryRole));
      }

      oBinding.filter(new sap.ui.model.Filter(aFilters, true));
    },

    _onRouteMatched: function () {
      const hash = window.location.hash;
      const bRefresh = hash.includes("refresh=true");

      if (bRefresh) {
        this._loadRolesData();
      }
    }



  });
});
