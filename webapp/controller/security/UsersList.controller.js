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
          this.getView().setModel(new JSONModel(),"editUserModel");
          // Crea un modelo para los usuarios y lo asigna a la vista (aquí se guarda la data en la propiedad "value")
          var oUsersModel = new JSONModel();
          this.getView().setModel(oUsersModel, "users");
          // Creamos el modelo con los valores iniciales
          var oNewUserModel = new JSONModel({
            USERID: "",
            PASSWORD: "",       // Nueva contraseña
            ALIAS: "",          // Alias del usuario
            FIRSTNAME: "",      // Primer nombre
            LASTNAME: "",       // Apellido
            EMPLOYEEID: "",     // ID de empleado
            EXTENSION: "",      // Extensión
            USERNAME: "",       // Nombre completo (podrías calcularlo a partir de FIRSTNAME y LASTNAME, si lo prefieres)
            PHONENUMBER: "",
            EMAIL: "",
            BIRTHDAYDATE: "",
            COMPANYID: "",
            COMPANYNAME:"",
            DEPARTMENT: "",     // Departamento o CEDI
            FUNCTION: "",
            ROLES: [],          // Roles coincide con arreglo, ya que se agregarán dinámicamente
            STREET: "",         // Calle
            POSTALCODE: "",     // Código postal
            CITY: "",           // Ciudad
            REGION: "",         // Región
            STATE: "",          // Estado
            COUNTRY: "",        // País
            AVATAR: ""          // URL o dato para el avatar
          });

            // Establecemos el binding mode en TwoWay para que la interfaz y el modelo se mantengan sincronizados
            oNewUserModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

            // Asignamos el modelo a la vista bajo el nombre "newUserModel"
            this.getView().setModel(oNewUserModel, "newUserModel");


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

        loadCompanies: async function () {
          try {
            // Realizar la solicitud para obtener las compañías
            const res = await fetch("http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=IdCompanies", {
              method: "GET",
              headers: { "Content-Type": "application/json" }
            });

            // Verificar si la solicitud fue exitosa
            if (!res.ok) {
              throw new Error("Error en la respuesta del servidor.");
            }

            // Convertir la respuesta a JSON
            const data = await res.json();

            // Validar si hay datos disponibles
            const aAllCompanies = data.value || [];
            const aFilteredCompanies = aAllCompanies.filter(
              (company) => company.DETAIL_ROW?.ACTIVED && !company.DETAIL_ROW?.DELETED
            );

            console.log("Compañías filtradas:", aFilteredCompanies); // Para depuración

            // Formatear los datos en el formato esperado por el ComboBox
            const companiesFormatted = aFilteredCompanies.map((company) => ({
              COMPANYID: company.COMPANYID,
              VALUEID: company.VALUEID,
              VALUE: company.VALUE || ""
            }));

            // Obtener o crear el modelo
            const oModel = this.getView().getModel("companies") || new JSONModel();

            // Actualizar los datos en el modelo
            oModel.setData({
              companies: companiesFormatted,
              originalData: aFilteredCompanies // Se guarda la data original por si se necesita más adelante
            });

            // Si el modelo no estaba asignado previamente, lo asignamos a la vista
            if (!this.getView().getModel("companies")) {
              this.getView().setModel(oModel, "companies");
            }

          } catch (error) {
            console.error("Error al cargar compañías:", error);
            MessageBox.error("Error al cargar compañías. Por favor, intente nuevamente.");
          }
        },

        loadDeptos: async function () {
          // Agregar la lógica para cargar departamentos según la compañía
          try{
          const res = await fetch("http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=IdDepartment", {
              method: "GET",
              headers: { "Content-Type": "application/json" }
            });

            // Verificar si la solicitud fue exitosa
            if (!res.ok) {
              throw new Error("Error en la respuesta del servidor.");
            }

            // Convertir la respuesta a JSON
            const data = await res.json();

            // Validar si hay datos disponibles
            const aAllDepartments = data.value || [];
            let aFilteredDepartment = aAllDepartments.filter(
              (department) => department.DETAIL_ROW?.ACTIVED && !department.DETAIL_ROW?.DELETED
            );
            // Obtén la compañía seleccionada. Se asume que se guarda en "newUserModel>/COMPANY"
            const sSelectedCompany = this.getView().getModel("newUserModel").getProperty("/COMPANYALIAS") || this.getView().getModel("editUserModel").getProperty("/COMPANYALIAS");

            // Si hay una compañía seleccionada, filtra los departamentos que correspondan.
            if (sSelectedCompany) {
              aFilteredDepartment = aFilteredDepartment.filter((department) => {
                // Se asume que department.VALUEPAID tiene un formato "prefijo-companyID"
                if (department.VALUEPAID) {
                  const parts = department.VALUEPAID.split("-");
                  // Se compara la segunda parte (companyID) con la compañía seleccionada.
                  return parts[1] === sSelectedCompany;
                }
                return false;
              });
            }

            console.log("Departamentos filtrados:", aFilteredDepartment); // Para depuración

            // Formatear los datos en el formato esperado por el ComboBox
            const departmentFormatted = aFilteredDepartment.map((department) => ({
              COMPANYID: department.COMPANYALIAS,
              VALUEID: department.VALUEID,
              VALUE: department.VALUE || ""
            }));

            // Obtener o crear el modelo
            const oModel = this.getView().getModel("departments") || new JSONModel();

            // Actualizar los datos en el modelo
            oModel.setData({
              departments: departmentFormatted,
              originalData: aFilteredDepartment // Se guarda la data original por si se necesita más adelante
            });

            // Si el modelo no estaba asignado previamente, lo asignamos a la vista
            if (!this.getView().getModel("departments")) {
              this.getView().setModel(oModel, "departments");
            }

          } catch (error) {
            console.error("Error al cargar departamentos:", error);
            MessageBox.error("Error al cargar departamentos. Por favor, intente nuevamente.");
          }
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

        onCompanySelected: function(oEvent){
          var oComboBox = oEvent.getSource();
          var sSelectedKey = oComboBox.getSelectedKey();
          var sSelectedText = oComboBox.getSelectedItem().getText();
          var sSelectedIndex = oComboBox.indexOfItem(oComboBox.getSelectedItem());
          var model,data;

          //ar oVBox;
          if(oComboBox.getId().includes("comboBoxCompanies")){
            model = this.getView().getModel("newUserModel");
            data = model.getData();
          }else{
            model = this.getView().getModel("editUserModel");
            data = model.getData();
          }

          data.COMPANYID = 1001 + sSelectedIndex;
          data.COMPANYALIAS = sSelectedKey;
          data.COMPANYNAME = sSelectedText;

          model.setData(data);
          this.loadDeptos();
        },

        onDeptSelected: function(oEvent){
          var oComboBox = oEvent.getSource();
          var sSelectedKey = oComboBox.getSelectedKey();
          //var sSelectedText = oComboBox.getSelectedItem().getText();
          var model,data;

          if (oComboBox.getId().includes("comboBoxCedis")) {
            model = this.getView().getModel("newUserModel");
            data = model.getData();
          } else {
            model = this.getView().getModel("editUserModel");
            data = model.getData();
          }

          data.DEPARTMENT = sSelectedKey;

          model.setData(data);
        },

        onRoleSelected: function (oEvent) {
          var oComboBox = oEvent.getSource();
          var sSelectedKey = oComboBox.getSelectedKey();
          var sSelectedText = oComboBox.getSelectedItem().getText();
          var model;
          var data;

          var oVBox;
          // Determina si es la modal de "add user" o "edit user"
          if (oComboBox.getId().includes("comboBoxEditRoles")) {
            oVBox = this.getView().byId("selectedEditRolesVBox");
            model = this.getView().getModel("editUserModel");
            data = model.getData();
          } else {
            oVBox = this.getView().byId("selectedRolesVBox");
            model = this.getView().getModel("newUserModel");
            data = model.getData();
          }

          // Verificar si el rol ya está agregado
          var bExists = oVBox
            .getItems()
            .some((oItem) => oItem.data("roleId") === sSelectedKey);
          if (bExists) {
            MessageToast.show("El rol ya ha sido añadido.");
            return;
          }
          data.ROLES.push({
            ROLEID:sSelectedKey
          });
          model.setData(data);
          // Crear un HBox con el rol seleccionado y un botón para eliminarlo
          var oHBox = new sap.m.HBox({
            items: [
              new sap.m.Label({ text: sSelectedText }).addStyleClass(
                "sapUiSmallMarginEnd"
              ),
              new sap.m.Button({
                icon: "sap-icon://decline",
                type: "Transparent",
                press: (oEvent2) => {
                  var roleIdToRemove = oHBox.data("roleId");
                  // Buscar el índice en el array basado en ROLEID:
                  var i = data.ROLES.findIndex(function (role) {
                    return role.ROLEID === roleIdToRemove;
                  });
                  if (i !== -1) {
                    data.ROLES.splice(i, 1);
                    model.setData(data);
                    oVBox.removeItem(oHBox);
                  }
                }
              })
            ]
          });
          
          oHBox.data("roleId", sSelectedKey);
          oVBox.addItem(oHBox);
        },

        /**
         * Abre la ventana de diálogo para agregar un nuevo usuario.
         */
        onAddUser: function () {
          var oView = this.getView();
            
          oView.getModel("newUserModel").setData({
            USERID: "",
            PASSWORD: "",       // Nueva contraseña
            ALIAS: "",          // Alias del usuario
            FIRSTNAME: "",      // Primer nombre
            LASTNAME: "",       // Apellido
            EMPLOYEEID: "",     // ID de empleado
            EXTENSION: "",      // Extensión
            USERNAME: "",       // Nombre completo (podrías calcularlo a partir de FIRSTNAME y LASTNAME, si lo prefieres)
            PHONENUMBER: "",
            EMAIL: "",
            BIRTHDAYDATE: "",
            COMPANY: "",
            DEPARTMENT: "",     // Departamento o CEDI
            FUNCTION: "",
            ROLES: [],          // Roles coincide con arreglo, ya que se agregarán dinámicamente
            STREET: "",         // Calle
            POSTALCODE: "",     // Código postal
            CITY: "",           // Ciudad
            REGION: "",         // Región
            STATE: "",          // Estado
            COUNTRY: "",        // País
            AVATAR: ""          // URL o dato para el avatar
          });
          if (!this._oCreateUserDialog) {
            Fragment.load({
              id: oView.getId(),
              name: "com.invertions.sapfiorimodinv.view.security.fragments.AddUserDialog",
              controller: this,
            }).then((oDialog) => {
              this._oCreateUserDialog = oDialog;
              oView.addDependent(oDialog);
              this.loadRoles();
              this.loadCompanies();
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
        onSaveUser: async function () {
          // Aquí la lógica para agregar el usuario. Por ejemplo, recoger los datos del modelo "UserDialogModel"
          // y enviarlos mediante fetch.
          const data = this.getView().getModel("newUserModel").getData();
          if(!data.USERID || !data.FIRSTNAME || !data.EMAIL){
            MessageToast.show("ID, Nombre y Correo son obligatorios.");
            return;
          }
          data.USERNAME = data.FIRSTNAME + " " + data.LASTNAME;

          try {
            const res = await fetch("http://localhost:4004/api/sec/usersCRUD?procedure=post", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                USERID: data.USERID,
                PASSWORD: data.PASSWORD,         // Nuevo campo: contraseña
                ALIAS: data.ALIAS,               // Nuevo: alias
                FIRSTNAME: data.FIRSTNAME,       // Nuevo: primer nombre
                LASTNAME: data.LASTNAME,         // Nuevo: apellido
                USERNAME: data.USERNAME,         // Puede ser concatenación o definido manualmente
                EMPLOYEEID: data.EMPLOYEEID,     // Nuevo: ID de empleado
                EXTENSION: data.EXTENSION,       // Nuevo: extensión
                PHONENUMBER: data.PHONENUMBER,
                EMAIL: data.EMAIL,
                BIRTHDAYDATE: data.BIRTHDAYDATE,
                COMPANYID: data.COMPANYID || "",     // Compañía
                COMPANYNAME: data.COMPANYNAME,
                DEPARTMENT: data.DEPARTMENT || "", // Departamento
                FUNCTION: data.FUNCTION || "",
                ROLES: data.ROLES || [],
                STREET: data.STREET,       // Nuevo: Calle
                POSTALCODE: data.POSTALCODE, // Nuevo: Código Postal
                CITY: data.CITY,             // Nuevo: Ciudad
                REGION: data.REGION,         // Nuevo: Región
                STATE: data.STATE,           // Nuevo: Estado
                COUNTRY: data.COUNTRY ,       // Nuevo: País
                AVATAR: data.AVATAR || ""          // Nuevo: Avatar
              })
            });

            if(!res.ok) {throw new Error(await res.text());}

            MessageToast.show("Usuario guardado exitosamente.");
            this._oCreateUserDialog.close();

            const model = this.getView().getModel("users");
            const aUsers = model.getProperty("/value");
            aUsers.push({
                ...data,
                DETAIL_ROW: {ACTIVED:true,DELTED:false}
            });

            model.setProperty("/value",aUsers);

          } catch (error) {
            MessageBox.error("Error al guardar el usuario: " + error.message);
          }
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
              this.loadCompanies();
              this.loadRoles();
              this.populateEditRoles();
              oDialog.open();
            });
          } else {
            this.populateEditRoles();
            this._oEditUserDialog.open();
          }
        },
        populateEditRoles: function () {
          // Obtén el VBox de roles de la vista de edición
          var oVBox = this.byId("selectedEditRolesVBox");
          // Limpia cualquier elemento previo
          oVBox.removeAllItems();

          // Obtén los datos del modelo de edición
          var oEditUserModel = this.getView().getModel("editUserModel");
          var oData = oEditUserModel.getData();

          // Verifica si existe la propiedad ROLES y es un array
          if (oData.ROLES && Array.isArray(oData.ROLES)) {
            oData.ROLES.forEach(function (oRole) {
              // Suponiendo que cada rol tiene las propiedades ROLEID y ROLENAME.
              var sRoleText = oRole.ROLENAME || oRole.ROLEID;

              // Crea el contenedor visual (HBox) para el rol
              var oHBox = new sap.m.HBox({
                items: [
                  new sap.m.Label({ text: sRoleText }).addStyleClass("sapUiSmallMarginEnd"),
                  new sap.m.Button({
                    icon: "sap-icon://decline",
                    type: "Transparent",
                    press: function (oEvent) {
                      // Obtén el ROLEID almacenado en el HBox
                      var roleIdToRemove = oHBox.data("roleId");
                      // Elimina el rol del arreglo
                      var aRoles = oData.ROLES;
                      var iIndex = aRoles.findIndex(function (r) {
                        return r.ROLEID === roleIdToRemove;
                      });
                      if (iIndex !== -1) {
                        aRoles.splice(iIndex, 1);
                        oEditUserModel.setData(oData);
                      }
                      // Elimina el HBox del VBox
                      oVBox.removeItem(oHBox);
                    }
                  })
                ]
              });
              // Guarda el ROLEID en el HBox para usarlo luego en la eliminación
              oHBox.data("roleId", oRole.ROLEID);

              // Agrega el HBox al VBox
              oVBox.addItem(oHBox);
            });
          }
        },


        /**
         * Lógica para guardar la información actualizada del usuario.
         */
        onEditSaveUser: async function () {
          var oEditUserModel = this.getView().getModel("editUserModel");
          var oData = oEditUserModel.getData();

          // Validación básica (ajústala según tus necesidades)
          if (!oData.USERID || !oData.FIRSTNAME || !oData.EMAIL) {
            MessageBox.error("ID, Primer Nombre y Correo Electrónico son obligatorios.");
            return;
          }

          try {
            // Aquí la lógica para actualizar el usuario en la base de datos.
          const res = await fetch(`http://localhost:4004/api/sec/usersCRUD?procedure=patch&userid=${oData.USERID}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                USERID: oData.USERID,
                PASSWORD: oData.PASSWORD,         // Nuevo campo: contraseña
                ALIAS: oData.ALIAS,               // Nuevo: alias
                FIRSTNAME: oData.FIRSTNAME,       // Nuevo: primer nombre
                LASTNAME: oData.LASTNAME,         // Nuevo: apellido
                USERNAME: oData.USERNAME,         // Puede ser concatenación o definido manualmente
                EMPLOYEEID: oData.EMPLOYEEID,     // Nuevo: ID de empleado
                EXTENSION: oData.EXTENSION,       // Nuevo: extensión
                PHONENUMBER: oData.PHONENUMBER,
                EMAIL: oData.EMAIL,
                BIRTHDAYDATE: oData.BIRTHDAYDATE,
                COMPANYID: oData.COMPANYID || "",     // Compañía
                COMPANYNAME: oData.COMPANYNAME,
                DEPARTMENT: oData.DEPARTMENT || "", // Departamento
                FUNCTION: oData.FUNCTION || "",
                ROLES: oData.ROLES || [],
                STREET: oData.STREET,       // Nuevo: Calle
                POSTALCODE: oData.POSTALCODE, // Nuevo: Código Postal
                CITY: oData.CITY,             // Nuevo: Ciudad
                REGION: oData.REGION,         // Nuevo: Región
                STATE: oData.STATE,           // Nuevo: Estado
                COUNTRY: oData.COUNTRY ,       // Nuevo: País
                AVATAR: oData.AVATAR || ""          // Nuevo: Avatar
              })
            });

            if (res.ok) {
              MessageToast.show("El usuario se ha actualizado correctamente.");
              // Opcional: Refrescar la lista de usuarios para reflejar los cambios
              this.loadUsers();
              // Cerrar el diálogo de edición, si existe
              if (this._oEditUserDialog) {
                this._oEditUserDialog.close();
              }
            } else {
              // Si la respuesta no es ok, se obtiene el mensaje de error (si lo hay)
              const errData = await res.json();
              MessageBox.error("Error al actualizar el usuario: " + (errData.message || res.statusText));
            }
          } catch (error) {
            MessageBox.error("Error al guardar el usuario: " + error.message);
          }
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
        deleteUser: async function (UserId) {
          // Aquí agregar la lógica para eliminar el usuario de la BD.
          try {
            const res = await fetch(`http://localhost:4004/api/sec/usersCRUD?procedure=delete&type=hard&userid=${UserId}`, {
              method: "POST",
            });
            if (res.ok) {
              // Puedes obtener el resultado si es necesario
              MessageToast.show("El usuario se ha eliminado correctamente.");
              // Refrescar la lista de usuarios para reflejar la eliminación
              this.loadUsers();
            } else {
              const errData = await res.json();
              MessageBox.error("Error al eliminar el usuario: " + (errData.message || res.statusText));
            }
          } catch (error) {
            MessageBox.error("Error al eliminar el usuario: " + error.message);
          }
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

        desactivateUser: async function (UserId) {
          // Aquí agregar la lógica para desactivar al usuario
          try {
            const res = await fetch(`http://localhost:4004/api/sec/usersCRUD?procedure=delete&type=logic&userid=${UserId}`, {
              method: "POST",
            });
            if (res.ok) {
              // Puedes obtener el resultado si es necesario
              MessageToast.show("El usuario se ha desactivado correctamente.");
              // Refrescar la lista de usuarios para reflejar la eliminación
              this.loadUsers();
            } else {
              const errData = await res.json();
              MessageBox.error("Error al desactivar el usuario: " + (errData.message || res.statusText));
            }
          } catch (error) {
            MessageBox.error("Error al desactivar el usuario: " + error.message);
          }
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

        activateUser: async function (UserId) {
          // Validación básica (ajústala según tus necesidades)
          if (!UserId ) {
            MessageBox.error("No hay usuario seleccionado");
            return;
          }
          try {
            // Aquí la lógica para actualizar el usuario en la base de datos.
          const res = await fetch(`http://localhost:4004/api/sec/usersCRUD?procedure=patch&userid=${UserId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                DETAIL_ROW: {ACTIVED:true,DELETED:false}
              })
            });

            if (res.ok) {
              MessageToast.show("El usuario se ha activado correctamente.");
              // Opcional: Refrescar la lista de usuarios para reflejar los cambios
              this.loadUsers();
              
            } else {
              // Si la respuesta no es ok, se obtiene el mensaje de error (si lo hay)
              const errData = await res.json();
              MessageBox.error("Error al activar el usuario: " + (errData.message || res.statusText));
            }
          } catch (error) {
            MessageBox.error("Error al activar el usuario: " + error.message);
          }
        },

        /**
         * Se ejecuta cuando se selecciona una fila en la tabla.
         * Actualiza el modelo "viewModel" para habilitar los botones y asigna el usuario seleccionado.
         */
        onUserRowSelected: function () {
          var oTable = this.byId("UsersTable");
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
          this.getView().getModel("editUserModel").setData(this.selectedUser);

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
          var oTable = this.byId("UsersTable");
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
        handleDateChange: function (oEvent) {
          const oDate = oEvent.getSource().getDateValue();
          if (oDate) {
            // Utiliza el formateador de fechas de UI5 con el patrón "dd/MM/yyyy"
            const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            const formattedDate = oDateFormat.format(oDate);
            this.getView().getModel("newUserModel").setProperty("/BIRTHDAYDATE", formattedDate);
          }
        }

      }
    );
  }
);
