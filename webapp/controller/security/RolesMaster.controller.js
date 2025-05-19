sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesMaster", {

    onInit: function () {
      this._catalogsLoaded = false;

      // Modelos iniciales
      this.getView().setModel(new JSONModel(), "selectedRole");
      this.getView().setModel(new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      }), "newRoleModel");

      // Cargar roles iniciales
      this.loadRolesData();

      // Preparar diálogo para agregar rol
      Fragment.load({
        name: "com.invertions.sapfiorimodinv.view.security.fragments.AddRoleDialog",
        controller: this
      }).then(dialog => {
        this.getView().addDependent(dialog);
        this._pDialog = dialog;
      });
    },

    // 🔄 Obtener lista de roles desde backend
    loadRolesData: async function () {
      try {
        const res = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all", { method: "POST" });
        const data = await res.json();

        const aAll = (data.value || []).filter(r => !r.DETAIL_ROW?.DELETED);
        const aFiltered = aAll.filter(r => r.DETAIL_ROW?.ACTIVED);

        this.getOwnerComponent().setModel(new JSONModel({
          value: aFiltered,
          valueAll: aAll,
          filterKey: "active"
        }), "roles");
      } catch (e) {
        MessageBox.error("Error al cargar roles.");
      }
    },

    // 📦 Cargar catálogo (una sola vez)
    loadCatalogsOnce: async function () {
      if (this._catalogsLoaded) return;

      await this.loadCatalog("IdProcesses", "processCatalogModel");
      await this.loadCatalog("IdPrivileges", "privilegeCatalogModel");
      this._catalogsLoaded = true;
    },

    // 📄 Cargar catálogo genérico
    loadCatalog: async function (labelId, modelName) {
      try {
        const res = await fetch(`http://localhost:4004/api/sec/catalogsR?procedure=get&type=bylabelid&labelid=${labelId}`);
        const data = await res.json();
        const values = data.value?.[0]?.VALUES || [];
        this.getView().setModel(new JSONModel({ values }), modelName);
      } catch (e) {
        console.error("Error cargando catálogo", labelId);
      }
    },

    // ➕ Abrir diálogo de crear rol
    onOpenDialog: async function () {
      await this.loadCatalogsOnce();

      this.getView().getModel("newRoleModel").setData({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      });

      this._pDialog.setTitle("Crear Rol");
      this._pDialog.open();
    },

    // ❌ Cerrar diálogo
    onDialogClose: function () {
      this._pDialog.close();
    },

    // ➕ Agregar privilegio temporalmente
    onAddPrivilege: function () {
      const model = this.getView().getModel("newRoleModel");
      const data = model.getData();

      if (!data.NEW_PROCESSID || !data.NEW_PRIVILEGES.length) {
        MessageToast.show("Selecciona proceso y al menos un privilegio.");
        return;
      }

      data.PRIVILEGES.push({
        PROCESSID: data.NEW_PROCESSID,
        PRIVILEGEID: data.NEW_PRIVILEGES
      });

      data.NEW_PROCESSID = "";
      data.NEW_PRIVILEGES = [];
      model.setData(data);
    },

    // 🧻 Eliminar privilegio
    onRemovePrivilege: function (oEvent) {
      const model = this.getView().getModel("newRoleModel");
      const data = model.getData();
      const index = oEvent.getSource().getParent().getBindingContext("newRoleModel").getPath().split("/").pop();
      data.PRIVILEGES.splice(index, 1);
      model.setData(data);
    },

    // 💾 Guardar nuevo rol
    onSaveRole: async function () {
      const data = this.getView().getModel("newRoleModel").getData();
      if (!data.ROLEID || !data.ROLENAME) {
        MessageToast.show("ID y Nombre del Rol son obligatorios.");
        return;
      }

      try {
        const res = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ROLEID: data.ROLEID,
            ROLENAME: data.ROLENAME,
            DESCRIPTION: data.DESCRIPTION,
            PRIVILEGES: data.PRIVILEGES
          })
        });

        if (!res.ok) throw new Error(await res.text());

        MessageToast.show("Rol guardado correctamente.");
        this._pDialog.close();

        const model = this.getOwnerComponent().getModel("roles");
        const aAll = model.getProperty("/valueAll");
        aAll.push({
          ...data,
          DETAIL_ROW: { ACTIVED: true, DELETED: false }
        });

        const filterKey = model.getProperty("/filterKey");
        const aFiltered = aAll.filter(r =>
          filterKey === "active" ? r.DETAIL_ROW?.ACTIVED :
          filterKey === "inactive" ? !r.DETAIL_ROW?.ACTIVED :
          !r.DETAIL_ROW?.DELETED
        );

        model.setProperty("/valueAll", aAll);
        model.setProperty("/value", aFiltered);

      } catch (e) {
        MessageBox.error("Error al guardar el rol: " + e.message);
      }
    },

    // 🎯 Selección de rol — obtiene detalles vía API
    onRoleSelected: async function () {
      const oTable = this.byId("rolesTable");
      const iIndex = oTable.getSelectedIndex();
      if (iIndex === -1) {
        MessageToast.show("Selecciona un rol válido.");
        return;
      }

      const oRole = oTable.getContextByIndex(iIndex).getObject();
      const sId = encodeURIComponent(oRole.ROLEID);

      try {
        const res = await fetch(`http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all&roleid=${sId}`, {
          method: "POST"
        });
        const result = await res.json();

        if (!result?.value?.length) {
          MessageBox.warning("No se encontró información del rol.");
          return;
        }

        this.getOwnerComponent().setModel(new JSONModel(result.value[0]), "selectedRole");
      } catch (e) {
        MessageBox.error("Error al obtener el rol: " + e.message);
      }
    },

    // 🔍 Buscar por nombre de rol
    onMultiSearch: function () {
      const query = this.byId("searchRoleName").getValue().toLowerCase();
      const binding = this.byId("rolesTable").getBinding("rows");
      const filters = query ? [new Filter("ROLENAME", FilterOperator.Contains, query)] : [];
      binding.filter(filters);
    },

    // 🔘 Cambiar filtro activo/inactivo/todos
    onStatusFilterChange: function (oEvent) {
      const key = oEvent.getSource().getSelectedKey();
      const model = this.getOwnerComponent().getModel("roles");
      const all = model.getProperty("/valueAll") || [];

      const filtered = all.filter(r =>
        key === "active" ? r.DETAIL_ROW?.ACTIVED && !r.DETAIL_ROW?.DELETED :
        key === "inactive" ? !r.DETAIL_ROW?.ACTIVED && !r.DETAIL_ROW?.DELETED :
        !r.DETAIL_ROW?.DELETED
      );

      model.setProperty("/value", filtered);
      model.setProperty("/filterKey", key);
    }

  });
});
