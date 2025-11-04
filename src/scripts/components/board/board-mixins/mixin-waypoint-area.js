import WaypointArea from '../waypoint-area/waypoint-area.js';

export default class MixinWaypointArea {
  /**
   * Build element area.
   */
  buildWaypointArea() {
    this.waypointArea = new WaypointArea(
      {
        globals: this.params.globals,
        dictionary: this.params.dictionary,
        waypoints: this.params.waypoints,
        waypointFields: this.params.waypointFields,
        zoomLevelDefault: this.params.zoomLevelDefault,
      },
      {
        onWaypointAdded: (waypoint) => {
          this.contentsButtons?.forceButton('waypoint', false);

          this.listElements.add({
            title: waypoint.getTitle(),
            details: waypoint.getDescription(),
            id: waypoint.getId(),
          });
        },
        showFormDialog: (waypoint, mode = 'add') => {
          const dialogConfig = {
            form: waypoint.getFormData().form,
            children: waypoint.getFormData().children,
            onDone: () => {
              this.listElements.update(waypoint.getId(), {
                title: waypoint.getTitle(),
                details: waypoint.getDescription(),
              });

              waypoint.updateMarkerAriaLabel();

              this.callbacks.onChanged({ waypoints: this.waypointArea.getWaypointsParams() });
            },
            onRemoved: () => {
              if (mode === 'add') {
                this.removeWaypoint(waypoint);
              }
              else {
                this.removeWaypointIfConfirmed(waypoint);
              }
            },
          };

          this.callbacks.showFormDialog(dialogConfig);
        },
        onWaypointFocusBlur: (id, state) => {
          const listElement = this.listElements.getById(id);
          if (!listElement) {
            return;
          }

          listElement.toggleHighlight(state);
        },
        onChanged: (values) => {
          values = values ?? { waypoints: this.waypointArea.getWaypointsParams() };
          this.callbacks.onChanged(values);
        },
      });
  }

  /**
   * Center map on waypoint.
   * @param {string} id ID of the waypoint.
   */
  centerOnWaypoint(id) {
    this.waypointArea.centerOnWaypoint(id);
  }

  /**
   * Change waypoint order.
   * @param {number} sourceIndex Source index.
   * @param {number} moveOffset Move offset.
   * @param {boolean} active Active state.
   */
  changeWaypointOrder(sourceIndex, moveOffset, active) {
    this.listElements.swapElements(sourceIndex, moveOffset, !active);

    this.waypointArea.changeWaypointOrder(sourceIndex, moveOffset);
  }

  /**
   * Edit waypoint.
   * @param {object} waypoint Waypoint to be edited.
   */
  editWaypoint(waypoint) {
    this.waypointArea.editWaypoint(waypoint);
  }

  /**
   * Get waypoint by ID.
   * @param {string} id ID of the waypoint.
   * @returns {object} Waypoint object.
   */
  getWaypointById(id) {
    return this.waypointArea.getWaypointById(id);
  }

  /**
   * Remove waypoint.
   * @param {object} waypoint Waypoint to be removed.
   */
  removeWaypoint(waypoint) {
    this.waypointArea.removeWaypoint(waypoint);
    this.listElements.remove(waypoint.getId());
  }

  /**
   * Remove element after confirmation.
   * @param {object} waypoint Waypoint to be removed.
   */
  removeWaypointIfConfirmed(waypoint) {
    this.params.globals.get('showConfirmationDialog')({
      headerText: this.params.dictionary.get('l10n.confirmationDialogRemoveWaypointHeader'),
      dialogText: this.params.dictionary.get('l10n.confirmationDialogRemoveWaypointDialog'),
      cancelText: this.params.dictionary.get('l10n.confirmationDialogRemoveWaypointCancel'),
      confirmText: this.params.dictionary.get('l10n.confirmationDialogRemoveWaypointConfirm'),
      callbackConfirmed: () => {
        this.removeWaypoint(waypoint);
      },
    });
  }

  /**
   * Toggle focus of waypoint.
   * @param {string} id ID of the waypoint.
   * @param {boolean} state Focus state.
   */
  toggleFocusOfWaypoint(id, state) {
    this.waypointArea.toggleFocusOfWaypoint(id, state);
  }

  /**
   * Toggle map mode.
   */
  toggleMapMode() {
    this.waypointArea.toggleMapMode();
  }

  /**
   * Set map style.
   * @param {object} value Map style ({ value: string, label: string }).
   */
  setMapStyle(value) {
    this.waypointArea.setMapStyle(value);
  }

  /**
   * Toggle mini map visibility.
   * @param {boolean} state Visibility state.
   */
  toggleMiniMapVisibility(state) {
    this.waypointArea.toggleMiniMapVisibility(state);
  }

  /**
   * Toggle path visibility.
   * @param {boolean} value Visibility state.
   */
  togglePathVisibility(value) {
    this.waypointArea.togglePathVisibility(value);
  }
}
