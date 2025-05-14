sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Log, MessageToast, MessageBox, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesMaster", {

    onInit: function () {
      this.initModels();
      this.loadRolesData();
      this.loadCatalog("IdProcesses", "processCatalogModel");
      this.loadCatalog("IdPrivileges", "privilegeCatalogModel");

      this.getOwnerComponent().getRouter()
        .getRoute("RouteRolesMaster")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    initModels: function () {
      const view = this.getView();
      view.setModel(new JSONModel(), "roles");
      view.setModel(new JSONModel(), "selectedRole");
      
      view.setModel(new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: "",
        PRIVILEGES: []
      }), "newRoleModel");
    },

    onOpenDialog: function () {
      this.getView().getModel("newRoleModel").setData({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: "",
        PRIVILEGES: []
      });
      this.byId("dialogAddRole").open();
    },

    onDialogClose: function () {
      this.byId("dialogAddRole").close();
    },

    onAddPrivilege: function () {
      const oModel = this.getView().getModel("newRoleModel");
      const oData = oModel.getData();

      if (!oData.NEW_PROCESSID || !Array.isArray(oData.NEW_PRIVILEGES) || oData.NEW_PRIVILEGES.length === 0) {
        MessageToast.show("Selecciona proceso y al menos un privilegio.");
        return;
      }

      oData.PRIVILEGES.push({
        PROCESSID: oData.NEW_PROCESSID,
        PRIVILEGEID: oData.NEW_PRIVILEGES
      });

      oData.NEW_PROCESSID = "";
      oData.NEW_PRIVILEGES = [];
      oModel.setData(oData);
    },

    onSaveRole: async function () {
      const oData = this.getView().getModel("newRoleModel").getData();

      if (!oData.ROLEID || !oData.ROLENAME) {
        MessageToast.show("ID y Nombre del Rol son obligatorios.");
        return;
      }

      try {
        const response = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ROLEID: oData.ROLEID,
            ROLENAME: oData.ROLENAME,
            DESCRIPTION: oData.DESCRIPTION,
            PRIVILEGES: oData.PRIVILEGES
          })
        });

        if (!response.ok) throw new Error(await response.text());

        MessageToast.show("Rol guardado correctamente.");
        this.byId("dialogAddRole").close();
        this.loadRolesData();
      } catch (err) {
        MessageBox.error("Error al guardar el rol: " + err.message);
      }
    },

    loadRolesData: async function () {
      try {
        const response = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all", {
          method: "POST"
        });
        const data = await response.json();

        const filteredRoles = (data.value || []).filter(role =>
          role.DETAIL_ROW?.ACTIVED === true &&
          role.DETAIL_ROW?.DELETED === false
        );

        this.getView().getModel("roles").setData({ value: filteredRoles });
      } catch (error) {
        Log.error("Error al cargar roles", error);
      }
    },

    loadCatalog: async function (labelId, modelName) {
      try {
        const response = await fetch(`http://localhost:4004/api/sec/catalogsR?procedure=get&type=bylabelid&&labelid=${labelId}`);
        const data = await response.json();
        const values = data.value?.[0]?.VALUES || [];
        this.getView().setModel(new JSONModel({ values }), modelName);
      } catch (err) {
        Log.error(`Error al cargar catálogo ${labelId}`, err);
      }
    },

    onRolePress: function (oEvent) {
      const oContext = oEvent.getParameter("listItem").getBindingContext("roles");
      if (!oContext) return MessageBox.error("No se encontró el contexto del rol seleccionado.");

      const oSelectedRoleModel = new JSONModel(oContext.getObject());
      this.getOwnerComponent().setModel(oSelectedRoleModel, "selectedRole");

      this.getOwnerComponent().getRouter().navTo("RouteRolesDetail", {
        roleId: encodeURIComponent(oContext.getObject().ROLEID)
      });
    },

    onMultiSearch: function () {
      const sQuery = this.byId("searchRoleName").getValue().toLowerCase();
      const oBinding = this.byId("rolesList").getBinding("items");
      const aFilters = sQuery ? [new Filter("ROLENAME", FilterOperator.Contains, sQuery)] : [];
      oBinding.filter(new Filter({ filters: aFilters, and: true }));
    },

    onRouteMatched: function () {
      if (window.location.hash.includes("refresh=true")) {
        this.loadRolesData();
      }
    }
  });
});
