import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../config";
const Navdata = () => {
  const history = useNavigate();
  const location = useLocation();

  const authUser = JSON.parse(sessionStorage.getItem("authUser"));
  const userId = authUser?.data?.user?._id;
  const isSuperAdmin = userId === "superadmin-id";
  const [iscurrentState, setIscurrentState] = useState("Dashboard");
  const [retreivedMenus, setRetreivedMenus] = useState([]);
  const [menuStates, setMenuStates] = useState({}); // dynamic toggle states

  function updateIconSidebar(e) {
    if (e?.target?.getAttribute("subitems")) {
      const ul = document.getElementById("two-column-menu");
      const iconItems = ul?.querySelectorAll(".nav-icon.active") || [];
      [...iconItems].forEach((item) => {
        item.classList.remove("active");
        const id = item.getAttribute("subitems");
        const el = document.getElementById(id);
        if (el) el.classList.remove("show");
      });
    }
  }
  // Function to collect all permitted paths from menus
  const getAllPermittedPaths = (menus) => {
    const paths = [];
    menus.forEach(menu => {
      if (menu.link && menu.link !== "/#") paths.push(menu.link);
      if (menu.subItems) {
        menu.subItems.forEach(sub => {
          paths.push(sub.link);
        });
      }
    });
    return paths;
  };

  // Reset state variables on current state change
  useEffect(() => {
    setMenuStates((prevStates) => {
      const newStates = {};
      Object.keys(prevStates).forEach((key) => {
        newStates[key] = key === iscurrentState;
      });
      return newStates;
    });
  }, [iscurrentState]);

  // console.log("current state is:", iscurrentState)

  // Fetch dynamic menu if not superadmin
  // useEffect(() => {
  //   const fetchDynamicMenu = async () => {
  //     try {

  //       const response = await fetch(`${api.API_URL}/users/${userId}/menu`);
  //       const data = await response.json();
  //       setRetreivedMenus(data.flatMenu);
  //     } catch (err) {
  //       console.error("Error fetching user menu:", err);
  //     }
  //   };

  //   if (userId && userId !== "superadmin-id") {
  //     fetchDynamicMenu();
  //   }
  // }, [userId]);




  // Check route permission
  useEffect(() => {
    if (!isSuperAdmin && retreivedMenus.length > 0) {
      const permittedPaths = getAllPermittedPaths(retreivedMenus);
      const currentPath = location.pathname;

      // Allow access to root or not-found page
      if (currentPath === "/" || currentPath === "/not-found") return;

      // Check if current path or any parent path is permitted
      const isPermitted = permittedPaths.some(path => {
        return currentPath.startsWith(path) ||
          (path !== "/dashboard" && currentPath.includes(path));
      });

      if (!isPermitted) {
        history("/not-found");
      }
    }
  }, [location.pathname, retreivedMenus, isSuperAdmin, history]);



  // Static full-access menu for superadmin
  const menuItems = [

    {
      id: "setups",
      label: "Academic Setups",
      icon: "ri-graduation-cap-line",
      link: "/#",
      stateVariables: menuStates["Setups"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, Setups: !prev.Setups }));
        setIscurrentState("Setups");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "program-categories",
          label: "program Categories",
          link: "/setup/parogram-categories",
          parentId: "setups",
        },

        {
          id: "schools",
          label: "Schools",
          link: "/setup/schools",
          parentId: "setups",
        },

        {
          id: "programs",
          label: "Programs",
          link: "/setup/programs",
          parentId: "setups",
        },
        {
          id: "institutions",
          label: "Institutions",
          link: "/setup/institutions",
          parentId: "setups",
        },

      ],
    },
    {
      id: "organization",
      label: "Organizations",
      icon: "ri-building-line",
      link: "/#",
      stateVariables: menuStates["Organizations"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, Organizations: !prev.Organizations }));
        setIscurrentState("Organizations");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "staffs",
          label: "Staffs",
          link: "/setup/staffs",
          parentId: "setups",
        },
        {
          id: "partner-categories",
          label: "Partner Categories",
          link: "/setup/partner-categories",
          parentId: "setups",
        },

        {
          id: "partners",
          label: "Partners",
          link: "/setup/partners",
          parentId: "setups",
        },


      ],
    },


    {
      id: "content-management",
      label: "Content Management",
      icon: "ri-file-list-3-line",
      stateVariables: menuStates["ContentManagement"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, ContentManagement: !prev.ContentManagement }));
        setIscurrentState("ContentManagement");
        updateIconSidebar(e);
      },
      subItems: [
        { id: "events", label: "Events", link: "/content/events", parentId: "content-management" },
        { id: "news", label: "News", link: "/content/news", parentId: "content-management" },
        { id: "facilities", label: "Facilities", link: "/content/facilities", parentId: "content-management" },


      ],
    },

    {
      id: "user-management",
      label: "User Management",
      icon: "ri-team-line",
      stateVariables: menuStates["UserManagement"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, UserManagement: !prev.UserManagement }));
        setIscurrentState("UserManagement");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "users",
          label: "Users",
          link: "/setting-users",
          parentId: "user-management",
        },
        {
          id: "roles",
          label: "Roles",
          link: "/setting-roles",
          parentId: "user-management",
        },
      ],
    },

    {
      id: "system-settings",
      label: "System Settings",
      icon: "ri-settings-3-line",
      stateVariables: menuStates["SystemSettings"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, SystemSettings: !prev.SystemSettings }));
        setIscurrentState("SystemSettings");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "profile",
          label: "Overview",
          link: "/setting-profile",
          parentId: "system-settings",
        },
        {
          id: "university",
          label: "University",
          link: "/setting-university",
          parentId: "system-settings",
        },
        {
          id: "senate",
          label: "Senate List",
          link: "/setting-senate",
          parentId: "system-settings",
        },

        {
          id: "history",
          label: "History",
          link: "/setting/history",
          parentId: "system-settings",
        },
        {
          id: "whySimad",
          label: "Why Simad",
          link: "/setting/why-simad",
          parentId: "system-settings",
        },

        {
          id: "accreditations",
          label: "Accreditations",
          link: "/setting-accreditations",
          parentId: "system-settings",
        },



      ],
    },

  ];

  // console.log("retreivced data is:", retreivedMenus);
  const dynamicMenu = retreivedMenus.map((item) => {
    const menuItem = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      link: item.link,
      stateVariables: menuStates[item.label] || false,
      click: (e) => {
        e.preventDefault();
        setMenuStates((prev) => ({
          ...prev,
          [item.label]: !prev[item.label],
        }));
        setIscurrentState(item.label);
        updateIconSidebar(e);
      }
    };

    // Only add subItems if they exist and length > 0
    if (item.subItems && item.subItems.length > 0) {
      menuItem.subItems = item.subItems.map((sub) => ({
        id: sub.id,
        label: sub.label,
        link: sub.link,
        parentId: sub.parentId,
      }));
    }

    return menuItem;
  });


  // const menuToRender = userId === "superadmin-id" ? menuItems : dynamicMenu;



  return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
