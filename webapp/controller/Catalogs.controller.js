sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast", // Ensure MessageToast is imported
    "jquery",
  ],
  function (Controller, JSONModel, Fragment, MessageToast, $) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.Catalogs",
      {
        onInit: function () {
          var oModel = new JSONModel();
          var that = this;

          this._oDialog = null;

          $.ajax({
            url: "http://localhost:4004/api/sec/getall",
            method: "GET",
            success: function (data) {
              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);
            },
          });
        },
        // ----- PARA FILTRAR EN LA TABLA
        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getSource().getValue();
          var oTable = this.byId("catalogTable");

          var aItems = oTable.getItems();

          if (!sQuery) {
            aItems.forEach(function (oItem) {
              oItem.setVisible(true);
            });
            return;
          }
          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext();
            if (!oContext) return;

            var oData = oContext.getObject();
            var bVisible = Object.keys(oData).some(function (sKey) {
              if (typeof oData[sKey] === "string") {
                return oData[sKey].toLowerCase().includes(sQuery.toLowerCase());
              }
              return false;
            });

            oItem.setVisible(bVisible);
          });
        },
        // ----- PARA AGREGAR UN NUEVO LABEL
        onAddCatalog: function () {
          // Inicializa el modelo con estructura completa
          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "seguridad", // Valor por defecto
            SEQUENCE: 10, // Valor por defecto
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
              DETAIL_ROW_REG: [
                {
                  CURRENT: false,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
                {
                  CURRENT: true,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
              ],
            },
          });

          this.getView().setModel(oModel, "addCatalogModel");

          // Cargar el diálogo si no existe
          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.fragments.AddCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oAddDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveCatalog: function () {
          var oModel = this.getView().getModel("addCatalogModel");
          var oData = oModel.getData();

          // Validación básica
          if (!oData.LABELID || !oData.LABEL) {
            MessageToast.show("LABELID y LABEL son campos requeridos");
            return;
          }

          // Preparar datos para enviar
          var payload = {
            values: oData,
          };

          console.log("Data:", JSON.stringify(oData));

          $.ajax({
            url: "http://localhost:4004/api/sec/newLabel", // Ajusta tu endpoint
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
              MessageToast.show("Catálogo agregado correctamente");
              this._oAddDialog.close();
              this._refreshCatalogTable(); // Método para refrescar la tabla
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error al guardar: " + error.responseText);
            },
          });
        },

        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        _refreshCatalogTable: function () {
          // Implementa la lógica para refrescar los datos de la tabla
          var oTable = this.byId("catalogTable");
          var oModel = this.getView().getModel();

          $.ajax({
            url: "http://localhost:4004/api/sec/getall",
            method: "GET",
            success: function (data) {
              oModel.setData({ value: data.value });
            },
          });
        },

        // ----- PARA EDITAR UN LABEL
        onEditPressed: function (oEvent) {
          // Obtener el item seleccionado
          var oSelectedItem =
            oEvent.getSource().getParent() || oEvent.getSource();
          var oBindingContext = oSelectedItem.getBindingContext();

          if (!oBindingContext) {
            MessageToast.show("Seleccione un registro para editar");
            return;
          }

          // Crear modelo para edición (copiamos los datos para no modificar directamente)
          var oOriginalData = oBindingContext.getObject();
          var oEditModel = new JSONModel(
            jQuery.extend(true, {}, oOriginalData)
          );
          this.getView().setModel(oEditModel, "editModel");

          // Guardar referencia al contexto original para actualizar después
          this._oEditContext = oBindingContext;

          // Cargar el diálogo de edición
          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.fragments.EditCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oEditDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oEditDialog.open();
          }
        },

        onSaveEdit: function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          // Mostrar indicador de carga
          this._setBusy(true);

          // Llamada a la API para actualizar
          $.ajax({
            url: "http://localhost:4004/api/sec/updateLabel", // Tu endpoint de actualización
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              values: oEditedData,
            }),
            success: function (response) {
              MessageToast.show("Registro actualizado correctamente");
              this._oEditDialog.close();

              // Actualizar el modelo local con los cambios
              this._oEditContext
                .getModel()
                .setProperty(this._oEditContext.getPath(), oEditedData);

              this._setBusy(false);
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error al actualizar: " + error.responseText);
              this._setBusy(false);
            }.bind(this),
          });
        },

        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },

        _setBusy: function (bBusy) {
          this.getView().setBusy(bBusy);
          if (this._oEditDialog) {
            this._oEditDialog.setBusy(bBusy);
          }
        },

        onItemPress: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;
          var sUrl =
            "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" +
            encodeURIComponent(sLabelID);
          var that = this;

          $.ajax({
            url: sUrl,
            method: "GET",
            dataType: "json",
            success: function (response) {
              var oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();
                  if (oController && oController.loadValues) {
                    // Pasa los valores y también el ítem seleccionado
                    oController.loadValues(response.value || []);

                    // Actualiza el selectedValue en el modelo values
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            },
            error: function () {
              MessageToast.show("Error al cargar valores");
            },
          });

          // Expandir el panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("100%"); // O el porcentaje/píxeles que prefieras
          }

          // Opcional: reducir el panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0%");
          }
        },

        onCloseDialog: function () {
          if (this._oDialog) {
            this._oDialog.close();
          }
        },

        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },
      }
    );
  }
);
