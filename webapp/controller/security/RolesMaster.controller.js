
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

      // Modelos para datos
      this.getView().setModel(new JSONModel(), "selectedRole");
      this.getView().setModel(new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_APPID: "",
        NEW_VIEWID: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      }), "newRoleModel");

      // Modelo para controlar el estado de los diálogos
      this.getView().setModel(new JSONModel({ currentDialog: null }), "uiDialogState");



      // Cargar datos y fragmentos
      this.loadRolesData();
      this._loadFragments();

      this.byId("btnEditar")?.setEnabled(false);
      this.byId("btnDesactivar")?.setEnabled(false);
      this.byId("btnEliminar")?.setEnabled(false);
    },


    /////////// -----------------------    MODALES Y CONFIGURACIONES  ----------------------------

    actualizarEstadoBotones: function () {
      const role = this.getOwnerComponent().getModel("selectedRole")?.getData();
      const activo = !!(role && role.ROLEID); // true si hay rol seleccionado

      this.byId("btnEditar")?.setEnabled(activo);
      this.byId("btnDesactivar")?.setEnabled(activo);
      this.byId("btnEliminar")?.setEnabled(activo);
    },


    _loadFragments: function () {
      var viewId = this.getView().getId();

      // Cargar los fragmentosssssssssss
      Fragment.load({
        id: viewId,
        name: "com.invertions.sapfiorimodinv.view.security.fragments.AddRoleDialog",
        controller: this
      }).then(function (dialog) {
        // @ts-ignore
        this.getView().addDependent(dialog);
        this._pDialog = dialog;
      }.bind(this));


      Fragment.load({
        id: viewId,
        name: "com.invertions.sapfiorimodinv.view.security.fragments.EditRoleDialog",
        controller: this
      }).then(function (dialog) {
        // @ts-ignore
        this.getView().addDependent(dialog);
        this._pEditDialog = dialog;
      }.bind(this));
    },

    //Inicializar modal
    guardarModal: function () {

      var model = this.getView().getModel("newRoleModel");

      model.setData({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      });

      //// cual es modal
      this.getView().getModel("uiDialogState").setProperty("/currentDialog", "add");

      this._pDialog.setTitle("Crear Rol");
      this._pDialog.open();
    },


    //CERRAR MODALES
    onDialogClose: function () {

      if (this._pDialog && this._pDialog.isOpen()) {
        this._pDialog.close();
      }

      if (this._pEditDialog && this._pEditDialog.isOpen()) {
        this._pEditDialog.close();
      }


      this.getView().getModel("uiDialogState").setProperty("/currentDialog", null);

      var oRolesView = this.getView().getParent().getParent();
      var oUiStateModel = oRolesView.getModel("uiState");
      if (oUiStateModel) {
        oUiStateModel.setProperty("/isDetailVisible", false);
      }
    },

    //Inicializar UPDATE modal
    onUpdateRole: function () {

      const role = this.getOwnerComponent().getModel("selectedRole")?.getData();

      if (!role) return;


      const model = new JSONModel({
        OLD_ROLEID: role.ROLEID,
        ROLEID: role.ROLEID,
        ROLENAME: role.ROLENAME,
        DESCRIPTION: role.DESCRIPTION,

        PRIVILEGES: (role.PROCESSES || []).map(proc => ({
          PROCESSID: proc.PROCESSID,
          PRIVILEGEID: (proc.PRIVILEGES || []).map(p => p.PRIVILEGEID),
          VIEWID: proc.VIEWID || "",
          APPLICATIONID: proc.APPLICATIONID || ""
        })),

        NEW_APPID: role.APPLICATIONID || "",
        NEW_VIEWID: role.VIEWID || "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: []
      });

      // Se define que el modelo tendrá TwoWay Binding (los cambios en los inputs se reflejan en el modelo automáticamente)
      model.setDefaultBindingMode("TwoWay");

      this.getView().setModel(model, "roleDialogModel");
      this.getView().getModel("uiDialogState").setProperty("/currentDialog", "edit");
      this._pEditDialog.setTitle("Editar Rol");
      this._pEditDialog.open();
    },


    // Filtrar view y procesos
    initFilteredCatalogModels: function () {
      this.getView().setModel(new JSONModel({ values: [] }), "filteredViews");
      this.getView().setModel(new JSONModel({ values: [] }), "filteredProcesses");
    },

    onAppChange: function (oEvent) {
      const appId = oEvent.getSource().getSelectedKey();
      const views = this.getView().getModel("allViews")?.getProperty("/values") || [];

      const filtered = views.filter(v => v.VALUEPAID === `IdApplications-${appId}`);
      this.getView().getModel("filteredViews").setProperty("/values", filtered);

      const dialog = this.getView().getModel("uiDialogState").getProperty("/currentDialog");
      const modelName = dialog === "edit" ? "roleDialogModel" : "newRoleModel";
      const model = this.getView().getModel(modelName);

      model.setProperty("/NEW_APPID", appId);
      model.setProperty("/NEW_VIEWID", "");
      model.setProperty("/NEW_PROCESSID", "");
      this.getView().getModel("filteredProcesses").setProperty("/values", []);
    },

    onViewChange: function (oEvent) {
      const viewId = oEvent.getSource().getSelectedKey();
      const processes = this.getView().getModel("allProcesses")?.getProperty("/values") || [];

      const filtered = processes.filter(p => p.VALUEPAID === `IdViews-${viewId}`);
      this.getView().getModel("filteredProcesses").setProperty("/values", filtered);

      const dialog = this.getView().getModel("uiDialogState").getProperty("/currentDialog");
      const modelName = dialog === "edit" ? "roleDialogModel" : "newRoleModel";
      const model = this.getView().getModel(modelName);

      model.setProperty("/NEW_VIEWID", viewId);
      model.setProperty("/NEW_PROCESSID", "");
    },

    onAddPrivilege: function () {
      const dialog = this.getView().getModel("uiDialogState").getProperty("/currentDialog");
      const modelName = dialog === "edit" ? "roleDialogModel" : "newRoleModel";
      const model = this.getView().getModel(modelName);
      const data = { ...model.getData() };

      const appId = data.NEW_APPID;
      const viewId = data.NEW_VIEWID;
      const procId = data.NEW_PROCESSID;
      const privs = data.NEW_PRIVILEGES;

      if (!procId || !Array.isArray(privs) || privs.length === 0 || !appId || !viewId) {
        MessageToast.show("Selecciona aplicación, página, proceso y al menos un privilegio.");
        return;
      }

      data.PRIVILEGES.push({
        PROCESSID: procId,
        PRIVILEGEID: privs,
        APPID: appId,     // Solo para mostrar en tabla
        VIEWID: viewId    // Solo para mostrar en tabla
      });

      // Limpiar campos
      data.NEW_PROCESSID = "";
      data.NEW_PRIVILEGES = [];
      data.NEW_VIEWID = "";
      data.NEW_APPID = "";

      model.setData(data);
    },

    onRemovePrivilege: function (oEvent) {
      const dialog = this.getView().getModel("uiDialogState").getProperty("/currentDialog");
      const modelName = dialog === "edit" ? "roleDialogModel" : "newRoleModel";
      const context = oEvent.getSource().getBindingContext(modelName);
      if (!context) return;

      const model = this.getView().getModel(modelName);
      const data = { ...model.getData() };
      const index = parseInt(context.getPath().split("/").pop());
      if (!isNaN(index)) {
        data.PRIVILEGES.splice(index, 1);
        model.setData(data);
      }
    },


    /////////// -----------------------    VALIDACIONES  ----------------------------

    onSaveRole: async function () {
      var data = this.getView().getModel("newRoleModel").getData();
      if (!data.ROLEID || !data.ROLENAME) {
        MessageToast.show("ID y Nombre del Rol son obligatorios.");
        return;
      }
      await this._guardarNuevoRol(data);
    },

    onUpdateRoleServer: async function () {
      var data = this.getView().getModel("roleDialogModel").getData();
      if (!data.ROLEID || !data.ROLENAME) {
        MessageToast.show("ID y Nombre del Rol son obligatorios.");
        return;
      }
      await this._actualizarRolExistente(data);
    },


    /////////// -----------------------   SERVICIOSSSSS  ----------------------------

    loadRolesData: async function () {
      try {
        var res = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all", {
          method: "POST"
        });


        var data = await res.json();


        var aAll = (data.value || []).filter(function (r) {
          return !r.DETAIL_ROW || !r.DETAIL_ROW.DELETED;
        });


        var aFiltered = aAll.filter(function (r) {
          return r.DETAIL_ROW && r.DETAIL_ROW.ACTIVED;
        });

        this.getOwnerComponent().setModel(new JSONModel({
          value: aFiltered,
          valueAll: aAll,
          filterKey: "active"
        }), "roles");

      } catch (e) {

        MessageBox.error("Error al cargar roles.");
      }
    },


    loadCatalog: async function (labelId, modelName) {
      try {
        var res = await fetch("http://localhost:4004/api/sec/catalogsR?procedure=get&type=bylabelid&labelid=" + labelId);
        var data = await res.json();
        var values = (data.value && data.value[0] && data.value[0].VALUES) || [];
        this.getView().setModel(new JSONModel({ values: values }), modelName);
      } catch (e) {
        console.error("Error cargando catálogo", labelId);
      }
    },


    _guardarNuevoRol: async function (data) {
      try {

        const res = await fetch("http://localhost:4004/api/sec/rolesCRUD?procedure=post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!res.ok) {
          const errorData = await res.json();
          const msg = errorData?.error?.message || "Error desconocido";
          MessageBox.error("Error al guardar el rol:\n" + msg);
          return;
        }

        MessageToast.show("Rol guardado correctamente.");

        this.onDialogClose();

        const nuevoRol = await this._cargarRol(encodeURIComponent(data.ROLEID));


        const model = this.getOwnerComponent().getModel("roles");
        const all = model.getProperty("/valueAll");
        all.push(nuevoRol);

        model.setProperty("/valueAll", all);
        model.setProperty("/value", all);


        this.getOwnerComponent().setModel(new JSONModel(nuevoRol), "selectedRole");

      } catch (e) {
        MessageBox.error("Error en la petición: " + e.message);
      }
    },

    _actualizarRolExistente: async function (data) {
      const roleid = data.OLD_ROLEID || data.ROLEID;

      try {

        const url = "http://localhost:4004/api/sec/rolesCRUD?procedure=put&roleid=" + encodeURIComponent(roleid);

        const payload = {
          ROLEID: data.ROLEID,
          ROLENAME: data.ROLENAME,
          DESCRIPTION: data.DESCRIPTION,
          PRIVILEGES: (data.PRIVILEGES || []).map(p => ({
            PROCESSID: p.PROCESSID,
            PRIVILEGEID: p.PRIVILEGEID
          }))
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          const msg = errorData?.error?.message || "Error desconocido";
          MessageBox.error("Error al actualizar el rol:\n" + msg);
          return;
        }


        MessageToast.show("Rol actualizado exitosamente.");


        this.onDialogClose();
        const rolActualizado = await this._cargarRol(encodeURIComponent(data.ROLEID));

        const model = this.getOwnerComponent().getModel("roles");
        const all = model.getProperty("/valueAll");

        const index = all.findIndex(r => r.ROLEID === data.OLD_ROLEID || r.ROLEID === data.ROLEID);

        if (index !== -1) {
          all[index] = rolActualizado;
        } else {

          all.push(rolActualizado);
        }

        model.setProperty("/valueAll", all);
        model.setProperty("/value", all);
        this.getOwnerComponent().setModel(new JSONModel(rolActualizado), "selectedRole");

      } catch (e) {
        MessageBox.error("Error en la petición: " + e.message);
      }
    },


    onDesactivateRole: async function () {
      const role = this.getOwnerComponent().getModel("selectedRole")?.getData();
      if (!role || !role.ROLEID) return;

      MessageBox.confirm("¿Desactivar este rol?", {
        onClose: async (accion) => {
          if (accion === MessageBox.Action.OK) {
            try {
              const url = `http://localhost:4004/api/sec/rolesCRUD?procedure=delete&type=logic&roleid=${encodeURIComponent(role.ROLEID)}`;
              const res = await fetch(url, { method: "POST" });
              if (!res.ok) {
                const err = await res.json();
                MessageBox.error("Error:\n" + (err?.error?.message || "Desconocido"));
                return;
              }
              MessageToast.show("Rol desactivado correctamente.");
              this._actualizarListaRolesEstado(role.ROLEID, false, true);
              this.onDialogClose();
            } catch (e) {
              MessageBox.error("Error en la operación: " + e.message);
            }
          }
        }
      });
    },

    onDeleteRole: async function () {
      const role = this.getOwnerComponent().getModel("selectedRole")?.getData();
      if (!role || !role.ROLEID) return;

      MessageBox.confirm("¿Eliminar permanentemente este rol?", {
        onClose: async (accion) => {
          if (accion === MessageBox.Action.OK) {
            try {
              const url = `http://localhost:4004/api/sec/rolesCRUD?procedure=delete&type=hard&roleid=${encodeURIComponent(role.ROLEID)}`;
              const res = await fetch(url, { method: "POST" });
              if (!res.ok) {
                const err = await res.json();
                MessageBox.error("Error:\n" + (err?.error?.message || "Desconocido"));
                return;
              }
              MessageToast.show("Rol eliminado permanentemente.");
              this._actualizarListaRolesEstado(role.ROLEID, false, true);
              this.onDialogClose();
            } catch (e) {
              MessageBox.error("Error en la operación: " + e.message);
            }
          }
        }
      });
    },




    /////////// -----------------------    MANEJAR LOS DATOS LOCALMENTE  ----------------------------

    _actualizarListaRolesEstado: function (roleId, actived, deleted) {

      const model = this.getOwnerComponent().getModel("roles");

      const all = model.getProperty("/valueAll").map(role =>
        role.ROLEID === roleId
          ? {
            ...role,
            DETAIL_ROW: {
              ...role.DETAIL_ROW,
              ACTIVED: actived,
              DELETED: deleted
            }
          }
          : role
      );

      const filterKey = model.getProperty("/filterKey");


      const filtered = all.filter(r =>
        filterKey === "active" ? r.DETAIL_ROW?.ACTIVED :
          filterKey === "inactive" ? !r.DETAIL_ROW?.ACTIVED :
            !r.DETAIL_ROW?.DELETED
      );

      model.setProperty("/valueAll", all);
      model.setProperty("/value", filtered);

      this.getOwnerComponent().setModel(new JSONModel({}), "selectedRole");
    },


    //BUSCADOR
    onMultiSearch: function () {
      const query = this.byId("searchRoleName").getValue().toLowerCase();
      const binding = this.byId("rolesTable").getBinding("rows");

      let filters = [];
      if (query) {
        filters = [
          new Filter({
            filters: [
              new Filter("ROLENAME", FilterOperator.Contains, query),
              new Filter("DESCRIPTION", FilterOperator.Contains, query)
            ],
            and: false
          })
        ];
      }

      binding.filter(filters);
    },

    onRoleSelected: function () {
      const oTable = this.byId("rolesTable");
      const iIndex = oTable.getSelectedIndex();
      if (iIndex === -1) return;

      const oRole = oTable.getContextByIndex(iIndex).getObject();
      this.getOwnerComponent().setModel(new JSONModel(oRole), "selectedRole");

      const oUiStateModel = this.getView().getModel("uiState");
      if (oUiStateModel) {
        oUiStateModel.setProperty("/isDetailVisible", true);
      }
      // Aquí actualizas los botones
      this.actualizarEstadoBotones();
    },

    _cargarRol: async function (roleId) {
      const getUrl = `http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all&roleid=${roleId}`;
      const res = await fetch(getUrl, { method: "POST" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error("Error al obtener el rol desde el backend: " + (err?.error?.message || "Desconocido"));
      }

      const fullRole = await res.json();
      const rol = fullRole?.value?.[0];

      if (!rol) {
        throw new Error("El rol no fue devuelto correctamente desde el backend.");
      }

      return rol;
    },

  });
});
