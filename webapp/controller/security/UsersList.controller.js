/* eslint-disable linebreak-style */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable fiori-custom/sap-no-localhost */
sap.ui.define(
  [
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "jquery",
  ],
  function (
    BaseController,
    JSONModel,
    Log,
    Fragment,
    MessageToast,
    MessageBox,
    $
  ) {
    "use strict";

    return BaseController.extend(
      "com.invertions.sapfiorimodinv.controller.security.UsersList",
      {
        onInit: function () {
          // Modelo para controlar el estado de los botones (habilitados o no)
          var oViewModel = new JSONModel({
            buttonsEnabled: false,
          });
          this.getView().setModel(oViewModel, "viewModel");

          // Crea un modelo para los usuarios y lo asigna a la vista (aquí se guarda la data en la propiedad "value")
          var oUsersModel = new JSONModel();
          this.getView().setModel(oUsersModel, "users");

          // Cargar los usuarios al iniciar la vista
          this.loadUsers();
        },

        /**
         * Función para cargar la lista de usuarios desde la API.
         */
        loadUsers: function () {
          var oUsersModel = this.getView().getModel("users");

          $.ajax({
            url: "http://localhost:4004/api/sec/usersCRUD?procedure=getall",
            method: "POST",
            success: function (data) {
              // Actualizar el modelo con los datos recibidos
              oUsersModel.setProperty("/value", data.value || data);
            },
            error: function (error) {
              console.error("Error loading users:", error);

              // Mostrar mensaje de error
              MessageBox.error(
                "Error al cargar los usuarios. Por favor, inténtelo de nuevo."
              );
            },
          });
        },

        loadCompanies: function () {
          // Agregar la lógica para cargar compañías, según sea necesario
        },

        loadDeptos: function () {
          // Agregar la lógica para cargar departamentos según la compañía
        },

        loadRoles: async function () {
          try {
            const res = await fetch(
              "http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all",
              {
                method: "POST",
              }
            );
            const data = await res.json();

            // Procesar los datos recibidos
            const aAllRoles = data.value || [];
            const aFilteredRoles = aAllRoles.filter(
              (role) => role.DETAIL_ROW?.ACTIVED && !role.DETAIL_ROW?.DELETED
            );

            console.log("Roles filtrados:", aFilteredRoles); // Para depuración

            // Crear array de roles en el formato que espera el ComboBox
            const rolesFormatted = aFilteredRoles.map((role) => ({
              ROLEID: role.ROLEID,
              ROLENAME: role.ROLENAME,
              // Puedes añadir más propiedades si las necesitas
              DESCRIPTION: role.DESCRIPTION || "",
            }));

            // Obtener o crear el modelo
            const oModel = this.getView().getModel("roles") || new JSONModel();

            // Actualizar los datos del modelo
            oModel.setData({
              roles: rolesFormatted,
              originalData: aFilteredRoles, // Guardamos los datos originales por si los necesitamos
            });

            // Establecer el modelo si no estaba asignado
            if (!this.getView().getModel("roles")) {
              this.getView().setModel(oModel, "roles");
            }
          } catch (e) {
            console.error("Error al cargar roles:", e);
            MessageBox.error(
              "Error al cargar roles. Por favor, intente nuevamente."
            );
          }
        },

        formatRoles: function (rolesArray) {
          return Array.isArray(rolesArray)
            ? rolesArray.map((role) => role.ROLENAME).join("-")
            : "";
        },

        onRoleSelected: function (oEvent) {
          var oComboBox = oEvent.getSource();
          var sSelectedKey = oComboBox.getSelectedKey();
          var sSelectedText = oComboBox.getSelectedItem().getText();

          var oVBox;
          // Determina si es la modal de "add user" o "edit user"
          if (oComboBox.getId().includes("comboBoxEditRoles")) {
            oVBox = this.getView().byId("selectedEditRolesVBox");
          } else {
            oVBox = this.getView().byId("selectedRolesVBox");
          }

          // Verificar si el rol ya está agregado
          var bExists = oVBox
            .getItems()
            .some((oItem) => oItem.data("roleId") === sSelectedKey);
          if (bExists) {
            MessageToast.show("El rol ya ha sido añadido.");
            return;
          }

          // Crear un HBox con el rol seleccionado y un botón para eliminarlo
          var oHBox = new sap.m.HBox({
            items: [
              new sap.m.Label({ text: sSelectedText }).addStyleClass(
                "sapUiSmallMarginEnd"
              ),
              new sap.m.Button({
                icon: "sap-icon://decline",
                type: "Transparent",
                press: () => oVBox.removeItem(oHBox),
              }),
            ],
          });
          oHBox.data("roleId", sSelectedKey);
          oVBox.addItem(oHBox);
        },

        /**
         * Abre la ventana de diálogo para agregar un nuevo usuario.
         */
        onAddUser: function () {
          var oView = this.getView();

          if (!this._oCreateUserDialog) {
            Fragment.load({
              id: oView.getId(),
              name: "com.invertions.sapfiorimodinv.view.security.fragments.AddUserDialog",
              controller: this,
            }).then((oDialog) => {
              this._oCreateUserDialog = oDialog;
              oView.addDependent(oDialog);
              this.loadRoles();
              oDialog.open();
            });
          } else {
            this._oCreateUserDialog.open();
          }
        },

        /**
         * Lógica al presionar "Guardar" en el diálogo de Agregar Usuario.
         * Aquí se debería enviar la información al backend.
         */
        onSaveUser: function () {
          // Aquí la lógica para agregar el usuario. Por ejemplo, recoger los datos del modelo "UserDialogModel"
          // y enviarlos mediante fetch.
        },

        onCancelUser: function () {
          if (this._oCreateUserDialog) {
            this._oCreateUserDialog.close();
          }
        },

        /**
         * Abre la ventana de diálogo para editar el usuario seleccionado.
         */
        onEditUser: function () {
          var oView = this.getView();

          if (!this._oEditUserDialog) {
            Fragment.load({
              id: oView.getId(),
              name: "com.invertions.sapfiorimodinv.view.security.fragments.EditUserDialog",
              controller: this,
            }).then((oDialog) => {
              this._oEditUserDialog = oDialog;
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this._oEditUserDialog.open();
          }
        },

        /**
         * Lógica para guardar la información actualizada del usuario.
         */
        onEditSaveUser: function () {
          // Aquí la lógica para actualizar el usuario en la base de datos.
        },

        onEditCancelUser: function () {
          if (this._oEditUserDialog) {
            this._oEditUserDialog.close();
          }
        },

        /**
         * Elimina el usuario seleccionado, previa confirmación.
         */
        onDeleteUser: function () {
          if (this.selectedUser) {
            var that = this;
            MessageBox.confirm(
              "¿Deseas eliminar el usuario con nombre: " +
                this.selectedUser.USERNAME +
                "?",
              {
                title: "Confirmar eliminación",
                icon: MessageBox.Icon.WARNING,
                onClose: function (oAction) {
                  if (oAction === MessageBox.Action.OK) {
                    that.deleteUser(that.selectedUser.USERID);
                  }
                },
              }
            );
          } else {
            MessageToast.show(
              "Selecciona un usuario para eliminar de la base de datos"
            );
          }
        },

        /**
         * Función para eliminar al usuario; aquí iría la llamada al backend.
         */
        deleteUser: function (UserId) {
          // Aquí agregar la lógica para eliminar el usuario de la BD.
        },

        /**
         * Desactiva el usuario seleccionado, previa confirmación.
         */
        onDesactivateUser: function () {
          if (this.selectedUser) {
            var that = this;
            MessageBox.confirm(
              "¿Deseas desactivar el usuario con nombre: " +
                this.selectedUser.USERNAME +
                "?",
              {
                title: "Confirmar desactivación",
                icon: MessageBox.Icon.WARNING,
                onClose: function (oAction) {
                  if (oAction === MessageBox.Action.OK) {
                    that.desactivateUser(that.selectedUser.USERID);
                  }
                },
              }
            );
          } else {
            MessageToast.show("Selecciona un usuario para desactivar");
          }
        },

        desactivateUser: function (UserId) {
          // Aquí agregar la lógica para desactivar al usuario
        },

        /**
         * Activa el usuario seleccionado, previa confirmación.
         */
        onActivateUser: function () {
          if (this.selectedUser) {
            var that = this;
            MessageBox.confirm(
              "¿Deseas activar el usuario con nombre: " +
                this.selectedUser.USERNAME +
                "?",
              {
                title: "Confirmar activación",
                icon: MessageBox.Icon.WARNING,
                onClose: function (oAction) {
                  if (oAction === MessageBox.Action.OK) {
                    that.activateUser(that.selectedUser.USERID);
                  }
                },
              }
            );
          } else {
            MessageToast.show("Selecciona un usuario para activar");
          }
        },

        activateUser: function (UserId) {
          // Aquí agregar la lógica para activar al usuario en la BD.
        },

        /**
         * Se ejecuta cuando se selecciona una fila en la tabla.
         * Actualiza el modelo "viewModel" para habilitar los botones y asigna el usuario seleccionado.
         */
        onUserRowSelected: function () {
          var oTable = this.byId("IdTable1UsersManageTable");
          var iSelectedIndex = oTable.getSelectedIndex();

          if (iSelectedIndex < 0) {
            this.getView()
              .getModel("viewModel")
              .setProperty("/buttonsEnabled", false);
            return;
          }

          var oContext = oTable.getContextByIndex(iSelectedIndex);
          var UserData = oContext.getObject();
          this.selectedUser = UserData;

          // Activa los botones
          this.getView()
            .getModel("viewModel")
            .setProperty("/buttonsEnabled", true);
        },

        /**
         * Aplica un filtro de búsqueda a la tabla de usuarios.
         */
        onSearchUser: function (oEvent) {
          var sQuery = oEvent.getParameter("query");
          var oTable = this.byId("IdTable1UsersManageTable");
          var oBinding = oTable.getBinding("rows");

          if (sQuery && sQuery.length > 0) {
            var aFilters = [
              new sap.ui.model.Filter(
                "USERNAME",
                sap.ui.model.FilterOperator.Contains,
                sQuery
              ),
            ];
            oBinding.filter(aFilters);
          } else {
            oBinding.filter([]);
          }
        },

        onRefresh: function () {
          this.loadUsers();
        },

        /**
         * Validación simple para correos electrónicos.
         */
        isValidEmail: function (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },

        /**
         * Validación simple para números telefónicos (10 dígitos).
         */
        isValidPhoneNumber: function (phone) {
          return /^\d{10}$/.test(phone);
        },
      }
    );
  }
);
