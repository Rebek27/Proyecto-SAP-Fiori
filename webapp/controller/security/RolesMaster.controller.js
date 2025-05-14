sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (BaseController, JSONModel, Log, MessageToast, MessageBox) {
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

      this._loadCatalog("IdProcesses", "processCatalogModel");
      this._loadCatalog("IdPrivileges", "privilegeCatalogModel");

      const oNewRoleModel = new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: "",
        PRIVILEGES: []
      });
      this.getView().setModel(oNewRoleModel, "newRoleModel");

    },

    onOpenDialog: function () {
      const oView = this.getView();
      const oDialog = oView.byId("dialogAddRole");

      // Inicializa datos vacíos
      oView.getModel("newRoleModel").setData({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: "",
        PRIVILEGES: []
      });

      oDialog.open();
    },

    onDialogClose: function () {
      this.byId("dialogAddRole").close();
    },

    onAddPrivilege: function () {
  const oModel = this.getView().getModel("newRoleModel");
  const oData = oModel.getData();

  if (!oData.NEW_PROCESSID || !oData.NEW_PRIVILEGES || oData.NEW_PRIVILEGES.length === 0) {
    MessageToast.show("Selecciona proceso y al menos un privilegio.");
    return;
  }

  oData.PRIVILEGES.push({
    PROCESSID: oData.NEW_PROCESSID,
    PRIVILEGEID: oData.NEW_PRIVILEGES
  });

  // Limpiar campos
  oData.NEW_PROCESSID = "";
  oData.NEW_PRIVILEGES = [];

  oModel.setData(oData);
},

    onSaveRole: async function () {
      const oModel = this.getView().getModel("newRoleModel");
      const oData = oModel.getData();

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

        if (!response.ok) {
          throw new Error(await response.text());
        }

        MessageToast.show("Rol guardado correctamente.");
        this.byId("dialogAddRole").close();
        this._loadRolesData();
      } catch (err) {
        MessageBox.error("Error al guardar el rol: " + err.message);
      }
    },

    _loadRolesData: async function () {
      try {
        const response = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all",
         {method: "POST"});
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

   _loadCatalog: async function (labelId, modelName) {
  try {
    const url = `http://localhost:4004/api/sec/catalogsR?procedure=get&type=bylabelid&&labelid=${labelId}`;
    const response = await fetch(url);
    const data = await response.json();

    const values = data.value?.[0]?.VALUES || [];
    const model = new sap.ui.model.json.JSONModel({ values });

    this.getView().setModel(model, modelName);
  } catch (err) {
    console.error(`Error al cargar catálogo ${labelId}`, err);
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
