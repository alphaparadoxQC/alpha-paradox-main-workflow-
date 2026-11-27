# This code is part of Alpha.
#
# (C) Copyright Alpha 2017, 2021.
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""This is the main module that defines what an element is in Alpha Paradox.

See the docstring of `QGeometryTables`
"""

import inspect
import logging
from typing import TYPE_CHECKING, Any, Iterable, List, Tuple, Union
from typing import Dict as Dict_

import pandas as pd
import shapely
from geopandas import GeoDataFrame, GeoSeries
from shapely.geometry.multipolygon import MultiPolygon  # to avoid MultiPolygons

from alpha_metal import Dict, config
from alpha_metal.draw import BaseGeometry
from alpha_metal.draw.utility import round_coordinate_sequence

if not config.is_building_docs():
    from alpha_metal.toolbox_python.utility_functions import (
        data_frame_empty_typed,
        get_range_of_vertex_to_not_fillet,
    )

if TYPE_CHECKING:
    from ..designs import QDesign
    from ..qlibrary.core import QComponent

__all__ = ["QGeometryTables", "is_qgeometry_table"]  # , 'ElementTypes']

# from collections import OrderedDict
# dict are ordered in Python 3.6+ by default, this is for backward compatibility

# class ElementTypes:
#     """
#     Types of qgeometry
#         positive : qgeometry that are positive mask
#         negative : qgeometry that will be subtracted from the chip ground plane
#         helper   : qgeometry that are only used in a helper capacity,
#                    such as labels or mesh rectangles
#     """
#     positive = 0
#     negative = 1
#     helper   = 2


def is_qgeometry_table(obj):
    """Check if an object is a Alpha BaseElementTable, i.e., an instance of
    `QGeometryTables`.

    The problem is that the `isinstance` built-in method fails
    when this module is reloaded.

    Args:
        obj (object): Test this object

    Returns:
        bool: True if is a Alpha element
    """
    if isinstance(obj, Dict):
        return False

    return hasattr(obj, "__i_am_qgeometry_table__")


#############################################################################
#
# Dictionary that specifies the column names of various element tables.
#

# TODO: implement data types in construction of tables?
# TODO: when a copy over the table and manipulate ehtmee
# i seem to loose the assignments to bool etc.

ELEMENT_COLUMNS = dict(
    ################################################
    # DO NOT MODIFY THE base DICTIONARY.
    # This is for Alpha API use only.
    # To add a new element type, add a new key below.
    base=dict(
        component=str,  # Unique ID of the component to which the element belongs
        name=str,  # name of the element
        geometry=object,  # shapely object
        layer=int,  # gds type of layer
        subtract=bool,  # do we subtract from the ground place of the chip
        helper=bool,  # helper or not
        chip=str,  # chip name
        # type=str,  # alpha, helper.   poly=10 or path=11
        __renderers__=dict(
            # ADD specific renderers here, all renderes must register here.
            # hfss = dict( ... ) # pick names as hfss_name
            # hfss=dict(
            #     boundary_name=str,
            #     material=str,
            #     perfectE=bool
            # ),
            # gds=dict(
            #     type=str,
            #     color=str,
            # )
        ),
    ),
    ################################################
    # Specifies a path, such as a CPW.
    # Ideas: chamfer
    path=dict(
        width=float,
        fillet=object,  # TODO: not decided yet how to represent this
        __renderers__=dict(),
    ),
    ################################################
    # Specifies a polygon
    # Ideas: chamfer
    poly=dict(
        fillet=object,  # TODO: not decided yet how to represent this
        __renderers__=dict(),
    ),
    ################################################
    # Specifies a junction as a 2 point line and width
    # This should provide enough information so as to
    # - render a sheet with inductance (from renderer options) + a vector for EPR
    # - generate ports (edge ports?) for Z analysis
    # - provice bounding box dimensions for the p-cell of ebeam junction layout
    #       for GDS renderer
    junction=dict(width=float, __renderers__=dict()),
    ################################################
    # Specifies a curved object, such as a circle. Perhaps as a buffered point
    # Not yet implemented
    # curved = dict(
    # __renderers__= dict(
    # )
    # )
)
"""Dictionary that specifies the column names of various element tables."""

#############################################################################
#
# Class to create, store, and handle element tables.
#
TRUE_BOOLS = [True, "True", "true", "Yes", "yes", "1", 1]


class QGeometryTables:
    """Class to create, store, and handle element tables.

    A regular user would not need to create tables themselves.
    This is handled automatically by the design creation and plugins.

    Structure:
        A component, such as a qubit, is a collection of qgeometry.
        For example, an element includes a rectangle, a cpw path, or a more general polygon.

        An element is a row in a table.

        All qgeometry of a type (Path or Polygon, or otherwise) are stored in a
        single table of their element type.

        All qgeometry of the same kind are stored in a table.
        A renderer has to know how to handle all types of qgeometry in order to render them.

    For plugin developers:
        In the following, we provide an example that illustrates for plugin developers how
        to add custom qgeometry and custom element properties. For example, we will add, for a renderer
        called hfss, a string property called 'boundary', a bool property called 'perfectE', and a property called 'material'.

    For plugin developers, example use:

        .. code-block:: python
            :linenos:
            :emphasize-lines: 4,6

            import alpha_metal as alpha

            design = alpha.designs.DesignPlanar()
            design.qgeometry = alpha.QGeometryTables(design)

            # return the path table - give access to ..
            design.qgeometry['path']
            design.qgeometry.table['path']

            # Define interfaces
            design.qgeometry.get_component(
                    component_name,
                    element_name,
                    columns=all or geom or list) # get all elements for components

            >>> component	name	geometry	layer	type	chip	subtract	fillet	color	width


    Now, if we want to add custom qgeometry through two fake renderers called hfss and gds:

        .. code-block:: python
            :linenos:
            :emphasize-lines: 1-15

            alpha.QGeometryTables.add_renderer_extension('hfss', dict(
                base=dict(
                    boundary=str,
                    perfectE=bool,
                    material=str,
                    )
                ))

            alpha.QGeometryTables.add_renderer_extension('gds', dict(
                path=dict(
                    color=str,
                    pcell=bool,
                    )
                ))

            design = alpha.designs.DesignPlanar()
            qgeometry = alpha.QGeometryTables(design)

            qgeometry.tables['path']
            >>> component	name	geometry	layer	type	chip	subtract	fillet	color	width	hfss_boundary	hfss_perfectE	hfss_material	gds_color	gds_pcell
    """

    # Dummy private attribute used to check if an instanciated object is
    # indeed a element table class. The problem is that the `isinstance`
    # built-in method fails when this module is reloaded.
    # Used by `is_element` to check.
    __i_am_qgeometry_table__ = True

    ELEMENT_COLUMNS = ELEMENT_COLUMNS
    """
    Table column names to use to create.
    This dict should be updated by renderers.
    """

    # For creating names of columns of renderer properties
    name_delimiter = "_"
    """ Delimiter to use when creating names of columns of renderer properties. """

    def __init__(self, design: "QDesign"):
        """The constructor for the `QGeometryTables` class.

        Args:
            design: Design in use
        """
        self._design = design

        self._tables = Dict()

        # Need to call after columns are added by add_renderer_extension is run by all the renderers.
        # self.create_tables()

    @property
    def design(self) -> "QDesign":
        """Return a reference to the parent design object."""
        return self._design

    @property
    def logger(self) -> logging.Logger:
        """Return the logger."""
        return self._design.logger

    @property
    def tables(self) -> dict[str, GeoDataFrame]:
        """The dictionary of tables containing qgeometry.

        Returns:
            Dict_[str, GeoDataFrame]: The keys of this dictionary are
            also obtained from `self.get_element_types()`
        """
        return self._tables

    @property
    def table(self) -> dict[str, GeoDataFrame]:
        """Alias for `tables` property."""
        return self._tables

    def __getitem__(self, key: str) -> GeoDataFrame:
        """Allow dict-like access to tables, e.g. design.qgeometry['path']."""
        if key in self._tables:
            return self._tables[key]
        raise KeyError(
            f"Table '{key}' not found in QGeometryTables. Available tables: {list(self._tables.keys())}"
        )

    def __setitem__(self, key: str, value: GeoDataFrame):
        """Allow dict-like assignment to tables."""
        self._tables[key] = value

    def __contains__(self, key: str) -> bool:
        """Check if table exists in qgeometry tables."""
        return key in self._tables

    def __iter__(self):
        """Iterate over table names."""
        return iter(self._tables)

    def __len__(self) -> int:
        """Return number of tables."""
        return len(self._tables)

    def keys(self):
        """Return table names."""
        return self._tables.keys()

    def values(self):
        """Return GeoDataFrames."""
        return self._tables.values()

    def items(self):
        """Return (table_name, GeoDataFrame) pairs."""
        return self._tables.items()

    def get_table(self, name: str) -> GeoDataFrame:
        """Return GeoDataFrame for the given table name."""
        return self[name]

    @classmethod
    def add_renderer_extension(cls, renderer_name: str, qgeometry: dict):
        """Add renderer element extension to ELEMENT_COLUMNS. Called when the
        load function of a renderer is called.

        Args:
            renderer_name (str): Name of renderer
            qgeometry (dict):  dict of dict.  Keys give element type names,
                              such as base, poly, path, etc.
        """
        # Make sure that the base and all other element kinds have this renderer registered
        for element_key in cls.ELEMENT_COLUMNS:
            if renderer_name not in cls.ELEMENT_COLUMNS[element_key]["__renderers__"]:
                cls.ELEMENT_COLUMNS[element_key]["__renderers__"][renderer_name] = (
                    dict()
                )

        # Now update the dictionaries with all qgeometry that the renderer may have
        for element_key, element_column_ext_dict in qgeometry.items():
            # The element the render is specifying is not in the specified qgeometry;
            # then add it. This shouldn't really happen.
            # The rest of the renderer dict keys in __renderers__  are missing for
            # the created type. Avoid doing, else hope it works.
            if element_key not in cls.ELEMENT_COLUMNS:
                cls.ELEMENT_COLUMNS[element_key] = dict(__renderers__=dict())

            # Now add qgeometry
            cls.ELEMENT_COLUMNS[element_key]["__renderers__"][renderer_name].update(
                element_column_ext_dict
            )

    # could use weakref memorization
    # https://stackoverflow.com/questions/33672412/python-functools-lru-cache-with-class-methods-release-object
    @classmethod
    def get_element_types(cls) -> list[str]:
        """Return the names of the available qgeometry to create. This does not
        include 'base', but is rather such as poly and path.

        Returns:
            list(str) : A list of name in self.ELEMENT_COLUMNS
        """
        # TODO: I should probably make this a variable and memorize, only change when qgeometry are added and removed
        # can be slow for performance to look up each time and recalculate, since may call this often
        names = list(cls.ELEMENT_COLUMNS.keys())
        names.remove("base")
        return names

    def create_tables(self):
        """Creates the default tables once. Populates the dict 'tables' of
        GeoDataFrame, each with columns corresponding to the types of qgeometry
        defined in ELEMENT_COLUMNS.

        Should only be done once when a new design is created.
        """
        self.logger.debug("Creating Element Tables.")

        for table_name in self.get_element_types():
            # Create GeoDataFrame with correct columns and d types
            assert isinstance(table_name, str)
            assert table_name.isidentifier()

            # Get column names
            # Base names, add concrete names, then add renderer names

            # Base names
            columns_base = self.ELEMENT_COLUMNS["base"].copy()
            columns_base_renderers = columns_base.pop("__renderers__")

            # Concrete names
            columns_concrete = self.ELEMENT_COLUMNS[table_name].copy()
            columns_concrete_renderer = columns_concrete.pop("__renderers__")

            assert isinstance(columns_base_renderers, dict) and isinstance(
                columns_concrete_renderer, dict
            ), (
                "Please make sure that all qgeometry types have __renderers__\
                     which is a dictionary."
            )

            # Combine all base names and renderer names
            columns = columns_base
            columns.update(columns_concrete)
            # add renderer columns: base and then concrete
            for renderer_key in columns_base_renderers:
                columns.update(
                    self._prepend_renderer_names(
                        table_name, renderer_key, columns_base_renderers
                    )
                )
                columns.update(
                    self._prepend_renderer_names(
                        table_name, renderer_key, columns_concrete_renderer
                    )
                )

            # Validate -- Throws an error if not valid
            self._validate_column_dictionary(table_name, columns)

            # Create df with correct column names
            table = GeoDataFrame(data_frame_empty_typed(columns))
            # not used elsewhere, also the name becomes "name" for some reason
            table.name = table_name

            # Assign
            self.tables[table_name] = table

    def _validate_column_dictionary(self, table_name: str, column_dict: dict):
        """Validate A possible error here is if the user did not pass a valid
        data type.

        Throws an error if not valid.

        Args:
            table_name (str): Name of element table (e.g., 'poly')
            column_dict (dict): Dictionary to check

        Raises:
            TypeError: Data type '' not understood
        """
        __pre = "ERROR CREATING ELEMENT TABLE FOR DESIGN: \
            \n  ELEMENT_TABLE_NAME = {table_name}\
            \n  KEY                = {k} \
            \n  VALUE              = {v}\n "

        # Are these assertions still holding true?
        for k, v in column_dict.items():
            assert isinstance(k, str), (
                __pre.format(**locals()) + " Key needs to be a string!"
            )
            assert k.isidentifier(), (
                __pre.format(**locals()) + " Key needs to be a valid string identifier!"
            )
            assert inspect.isclass(v), (
                __pre.format(**locals()) + " Value needs to be a class!"
            )

    def get_rname(self, renderer_name: str, key: str) -> str:
        """Get name for renderer property.

        Args:
            renderer_name (str): Name of the renderer
            key (str): Key to get the name for

        Returns:
            str: The unique named used as a column in the table
        """
        return renderer_name + self.name_delimiter + key

    def _prepend_renderer_names(self, table_name: str, renderer_key: str, rdict: dict):
        """Prepare all the renderer names.

        Args:
            table_name (str): Unused
            renderer_key (str): Key to check for
            rdict (dict): Renderer dictionary

        Returns:
            dict: Prepared dictionary

        TODO:
            This function has arguments that are unused, fix the function or ditch the unused args
        """
        return {
            self.get_rname(renderer_key, k): v
            for k, v in rdict.get(renderer_key, {}).items()
        }

    def add_qgeometry(
        self,
        kind: str,
        component_name: str,
        geometry: dict,
        subtract: bool = False,
        helper: bool = False,
        layer: Union[int, str] = 1,  # chip will be here
        chip: str = "main",
        **other_options,
    ):
        """Main interface to add qgeometries.

        Args:
            kind (str): Must be in get_element_types ('path', 'poly', etc.).
            component_name (str): Component name.
            geometry (dict): Dict of shapely geometry.
            subtract (bool): Subtract - passed through.  Defaults to False.
            helper (bool): Helper - passed through.  Defaults to False.
            layer (Union[int, str]): Layer - passed through.  Defaults to 1.
            chip (str): Chip name - passed through.  Defaults to 'main'.
            **other_options (object): Other_options - passed through.
        """
        # TODO: Add unit test

        # ensure correct types
        if not isinstance(subtract, bool):
            subtract = subtract in TRUE_BOOLS
        if not isinstance(helper, bool):
            helper = helper in TRUE_BOOLS

        if kind not in self.get_element_types():
            self.logger.error(
                f"Creator user error: Unknown element kind=`{kind}`"
                f"Kind must be in {self.get_element_types()}. This failed for component"
                f"name = `{component_name}`.\n"
                f" The call was with subtract={subtract} and helper={helper}"
                f" and layer={layer}, and options={other_options}"
            )

        # Checks if (any) of the geometry are MultiPolygons, and breaks them up into
        # individual polygons. Rounds the coordinate sequences of those values to avoid
        # numerical errors.
        rounding_val = self.design.template_options["PRECISION"]
        new_dict = Dict()
        for key, item in geometry.items():
            # Keys become the ``name`` column, which renderers treat as a
            # string (e.g. the HFSS name sanitiser uses re.sub). Coerce
            # non-string keys such as ``{0: jj_line}`` (#995).
            name = str(key)
            if isinstance(item, MultiPolygon):
                shape_count = 0
                for shape_temp in item.geoms:
                    new_dict[name + "_" + str(shape_count)] = round_coordinate_sequence(
                        shape_temp, rounding_val
                    )
                    shape_count += 1
            else:
                new_dict[name] = round_coordinate_sequence(item, rounding_val)

        geometry = new_dict

        # Create options TODO: Might want to modify this (component_name -> component_id)
        # Give warning if length is to be fillet's and not long enough.
        self.check_lengths(geometry, kind, component_name, **other_options)

        # Create options
        options = dict(
            component=component_name,
            subtract=subtract,
            helper=helper,
            layer=int(layer),
            chip=chip,
            **other_options,
        )

        # replaces line above to generate the options.
        # for keyC in design.qgeometry.tables[kind].columns:
        #    if keyC != 'geometry':
        #        options[keyC] = ???[keyC] -> alternative manner to pass options to the add_qgeometry function?
        #                                       instead have the add_qeometry in baseComponent generate the dict?

        # Could we just append rather than make a new table each time? This seems slow
        table = self.tables[kind]

        # assert that all names in options are in table columns! TODO: New approach will not be wanting
        # to do this (maybe check that all columns are in options?)
        df = GeoDataFrame.from_dict(geometry, orient="index", columns=["geometry"])
        df.index.name = "name"
        df = df.reset_index()

        df = df.assign(**options)

        # Set new table. Unfortunately, this creates a new instance. Can just direct append
        # Set new table. Ensure it remains a GeoDataFrame
        combined_df = pd.concat(
            [table, df],
            axis=0,
            join="outer",
            ignore_index=True,
            sort=False,
            verify_integrity=False,
        )
        if not isinstance(combined_df, GeoDataFrame):
            combined_df = GeoDataFrame(combined_df, geometry="geometry")
        self.tables[kind] = combined_df

    def check_lengths(
        self,
        geometry: shapely.geometry.base.BaseGeometry,
        kind: str,
        component_name: str,
        **other_options,
    ):
        """If user wants to fillet, check the line-segments to see if it is too
        short for fillet.

        Args:
            geometry (shapely.geometry.base.BaseGeometry): The LineString to investigate.
            kind (str): Name of table, i.e. 'path', 'poly', 'junction, etc
            component_name (str): Is an integer id.
        """

        if "fillet" in other_options.keys():
            fillet = other_options["fillet"]

            for key, geom in geometry.items():
                if isinstance(geom, shapely.geometry.LineString):
                    coords = list(geom.coords)
                    qdesign_precision = getattr(
                        self.design.template_options,
                        "PRECISION",
                        self.design.template_options.get("PRECISION", 10),
                    )
                    range_vertex_of_short_segments = get_range_of_vertex_to_not_fillet(
                        coords, fillet, qdesign_precision, add_endpoints=False
                    )

                    if len(range_vertex_of_short_segments) > 0:
                        range_string = ""
                        for item in range_vertex_of_short_segments:
                            range_string += f"({item[0]}-{item[1]}) "
                        text_id = (
                            self.design._components[component_name]._name
                            if isinstance(component_name, int)
                            and component_name in self.design._components
                            else str(component_name)
                        )
                        self.logger.warning(
                            f"For {kind} table, component={text_id}, key={key}"
                            f" has short segments that could cause issues with fillet. Values in {range_string} "
                            f"are index(es) in shapely geometry."
                        )

    def parse_value(self, value: Union[Any, list, Dict, Iterable]) -> Any:
        """Same as design.parse_value. See design for help.

        Returns:
            Parsed value of input.
        """
        return self.design.parse_value(value)

    def clear_all_tables(self):
        """Clear all the internal tables and all else.

        Use when clearing a design and starting from scratch.
        """
        self.tables.clear()
        self.create_tables()  # remake all tables

    def delete_component(self, name: Union[str, int]):
        """Delete component by name or ID.

        Args:
            name (Union[str, int]): Name or ID of component (case sensitive)
        """
        comp_id = None
        comp_name = None
        if isinstance(name, int):
            comp_id = name
            if comp_id in self.design._components:
                comp_name = self.design._components[comp_id].name
        elif name in self.design.components:
            a_comp = self.design.components[name]
            comp_id = a_comp.id
            comp_name = a_comp.name
        else:
            comp_name = str(name)

        for table_name in self.tables:
            df = self.tables[table_name]
            mask = (
                (df["component"] == comp_id)
                | (df["component"] == comp_name)
                | (df["component"] == str(comp_id))
                | (df["component"] == str(name))
            )
            self.tables[table_name] = df[~mask]

    def delete_component_id(self, component_id: int):
        """Drop the components within the qgeometry.tables.

        Args:
            component_id (int): Unique number to describe the component.
        """
        self.delete_component(component_id)

    def get_component(
        self, name: Union[str, int], table_name: str = "all"
    ) -> Union[GeoDataFrame, dict[str, GeoDataFrame], None]:
        """Return the table for just a given component. If all, returns a
        dictionary with keys as table names and tables of components as values.

        Args:
            name (Union[str, int]): Name or ID of component (case sensitive). Defaults to 'all'.
            table_name (str): Element table name ('poly', 'path', etc.). Defaults to 'all'.

        Returns:
            Union[GeoDataFrame, Dict_[str, GeoDataFrame]]: Either a GeoDataFrame or a dict of GeoDataFrames.

        Example usage:
            ```table = pd.concat(qgeometry.get_component('Q1')) # , axis=0```
        """
        if table_name == "all":
            tables = {}
            for t_name in self.get_element_types():
                tables[t_name] = self.get_component(name, t_name)
            return tables
        else:
            if table_name not in self.tables:
                return None
            df = self.tables[table_name]
            comp_id = None
            comp_name = None
            if isinstance(name, int):
                comp_id = name
                if comp_id in self.design._components:
                    comp_name = self.design._components[comp_id].name
            elif name in self.design.components:
                a_comp = self.design.components[name]
                comp_id = a_comp.id
                comp_name = a_comp.name
            else:
                for c_id, c_obj in getattr(self.design, "_components", {}).items():
                    if getattr(c_obj, "name", None) == name or getattr(c_obj, "_name", None) == name:
                        comp_id = c_id
                        comp_name = name
                        break
                if comp_id is None:
                    comp_name = str(name)

            mask = (
                (df["component"] == comp_id)
                | (df["component"] == comp_name)
                | (df["component"] == str(comp_id))
                | (df["component"] == str(name))
            )
            return df[mask]

    def get_component_bounds(self, name: Union[str, int]) -> tuple[float, float, float, float]:
        """Returns a tuple containing minx, miny, maxx, maxy values for the
        bounds of the component as a whole.

        Args:
            name (Union[str, int]): Component name or ID

        Returns:
            tuple[float, float, float, float]: (minx, miny, maxx, maxy) bounds
        """
        gs = self.get_component_geometry(name)  # Pandas GeoSeries
        if len(gs) == 0:
            return (0.0, 0.0, 0.0, 0.0)
        else:
            return tuple(float(x) for x in gs.total_bounds)

    def rename_component(self, component_id: int, new_name: str):
        """Rename component by ID (integer) cast to string format.

        Args:
            component_id (int) : ID of component (case sensitive)
            new_name (str) : The new name of the component (case sensitive)
        """
        component_int_id = int(component_id)
        old_name = None
        a_comp = self.design._components.get(component_int_id)
        if a_comp is not None:
            old_name = getattr(a_comp, "name", getattr(a_comp, "_name", None))
            a_comp._name = new_name
            if old_name and hasattr(self.design, "components") and old_name in self.design.components:
                try:
                    del self.design.components[old_name]
                except Exception:
                    pass
            if hasattr(self.design, "components"):
                try:
                    self.design.components[new_name] = a_comp
                except Exception:
                    pass

        for table_name in self.tables:
            df = self.tables[table_name]
            mask = (
                (df["component"] == component_int_id)
                | (df["component"] == str(component_int_id))
            )
            if old_name:
                mask = mask | (df["component"] == old_name)
            self.tables[table_name].loc[mask, "component"] = component_int_id


    def get_component_geometry_list(
        self, name: Union[str, int], table_name: str = "all"
    ) -> list[BaseGeometry]:
        """Return just the bare element geometry (shapely geometry objects) as
        a list, for the selected component.

        Args:
            name (Union[str, int]) : Name or ID of component (case sensitive)
            table_name (str) : Element type ('poly', 'path', etc.).
                               Can also be 'all' to return all. This is the default.

        Returns:
            list: List of shapely.geometry objects
        """
        if table_name == "all":
            qgeometry = []
            for t_name in self.get_element_types():
                qgeometry += self.get_component_geometry_list(name, t_name)
            return qgeometry
        else:
            if table_name not in self.tables:
                return []
            table = self.tables[table_name]
            comp_id = None
            comp_name = None
            if isinstance(name, int):
                comp_id = name
                if comp_id in self.design._components:
                    comp_name = self.design._components[comp_id].name
            elif name in self.design.components:
                comp_id = self.design.components[name].id
                comp_name = self.design.components[name].name
            else:
                comp_name = str(name)

            mask = (
                (table["component"] == comp_id)
                | (table["component"] == comp_name)
                | (table["component"] == str(comp_id))
                | (table["component"] == str(name))
            )
            return table.geometry[mask].to_list()

    def get_component_geometry(self, name: Union[str, int]) -> GeoSeries:
        """Returns geometry of a given component.

        Args:
            name (Union[str, int]) : Name or ID of component (case sensitive)

        Returns:
            GeoSeries : Geometry of the component
        """
        comp_id = None
        comp_name = None
        if isinstance(name, int):
            comp_id = name
            if comp_id in self.design._components:
                comp_name = self.design._components[comp_id].name
        elif name in self.design.components:
            comp_id = self.design.components[name].id
            comp_name = self.design.components[name].name
        else:
            comp_name = str(name)

        qgeom_list = []
        for table_name in self.get_element_types():
            table = self.tables[table_name]
            mask = (
                (table["component"] == comp_id)
                | (table["component"] == comp_name)
                | (table["component"] == str(comp_id))
                | (table["component"] == str(name))
            )
            sub = table.geometry[mask]
            if len(sub) > 0:
                qgeom_list.append(sub)

        if len(qgeom_list) == 0:
            return GeoSeries([], dtype=object)

        qgeometry = pd.concat(qgeom_list, ignore_index=True)
        if not isinstance(qgeometry, GeoSeries):
            qgeometry = GeoSeries(qgeometry)
        return qgeometry

    def get_component_geometry_dict(
        self, name: Union[str, int], table_name: str = "all"
    ) -> Union[Dict, dict]:
        """Return just the bare element geometry (shapely geometry objects) as
        a dict, with key being the names of the qgeometry and the values as the
        shapely geometry, for the selected component.

        Args:
            name (Union[str, int]) : Name or ID of component (case sensitive)
            table_name (str) : Element type ('poly', 'path', etc.). Defaults to 'all'.

        Returns:
            dict: Bare element geometry
        """
        if table_name == "all":
            qgeometry = Dict()
            for t_name in self.get_element_types():
                qgeometry[t_name] = self.get_component_geometry_dict(name, t_name)
            return qgeometry
        else:
            if table_name not in self.tables:
                return {}
            table = self.tables[table_name]
            comp_id = None
            comp_name = None
            if isinstance(name, int):
                comp_id = name
                if comp_id in self.design._components:
                    comp_name = self.design._components[comp_id].name
            elif name in self.design.components:
                comp_id = self.design.components[name].id
                comp_name = self.design.components[name].name
            else:
                comp_name = str(name)

            mask = (
                (table["component"] == comp_id)
                | (table["component"] == comp_name)
                | (table["component"] == str(comp_id))
                | (table["component"] == str(name))
            )
            df_comp_id = table.loc[mask, ["name", "geometry"]]
            if df_comp_id.empty:
                return {}
            df_geometry = df_comp_id.geometry
            df_geometry.index = df_comp_id.name
            return df_geometry.to_dict()

    def check_element_type(self, table_name: str, log_issue: bool = True) -> bool:
        """Check if the name `table_name` is in the element tables.

        Args:
            table_name (str): Element type ('poly', 'path', etc.) or 'all'
            log_issue (bool): Throw an error in the log if name missing. Defaults to True.

        Returns:
            bool: True if the name is valid, else False
        """
        if table_name not in self.get_element_types() and table_name != "all":
            if log_issue:
                self.logger.error(
                    f"Element Tables: Tried to access non-existing element table: `{table_name}`"
                )
            return False
        else:
            return True

    def get_all_unique_layers_for_all_tables(
        self, qcomp_ids: Union[list, None] = None
    ) -> list:
        """Get a list of all unique layer number used in all of the geometry tables.
        User can get for all components or a subset.

        Args:
            qcomp_ids (Union[list, None], optional): The list has integers
                                        which denote component_id. Defaults to None.

        Returns:
            list: The unique layer numbers for the list of component ids passed in argument.
        """
        if qcomp_ids is None:
            qcomp_ids = []
        frames = list()

        if len(qcomp_ids) == 0:
            frames = [self.tables[a_df] for a_df in self.tables if not self.tables[a_df].empty]
        else:
            for table_key in self.tables:
                temp_df = self.tables[table_key]
                if not temp_df.empty:
                    mask_temp = temp_df["component"].isin(qcomp_ids)
                    subset_temp_df = temp_df[mask_temp]
                    if not subset_temp_df.empty:
                        frames.append(subset_temp_df)

        if len(frames) == 0:
            return []

        unique_layers = list(pd.concat(frames, ignore_index=True)["layer"].unique())
        return sorted([int(l) for l in unique_layers if pd.notnull(l)])

    def get_all_unique_layers(self, chip_name: str) -> list:
        """Returns a list of unique layers for the given chip names.

        Args:
            chip_name (str): Name of the chip

        Returns:
            list: List of unique layers
        """
        unique_layers = list()
        for table_name in self.get_element_types():
            table = self.tables.get(table_name)
            if table is not None and not table.empty and "chip" in table.columns:
                temp = table[table["chip"] == chip_name]
                if not temp.empty and "layer" in temp.columns:
                    layers = temp["layer"].unique().tolist()
                    unique_layers += layers
        return sorted(list(set(int(l) for l in unique_layers if pd.notnull(l))))

