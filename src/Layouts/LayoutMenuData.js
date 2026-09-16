import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyPermissions } from "../helpers/backend_helper";
const Navdata = () => {
  const history = useNavigate();
  const location = useLocation();

  const [iscurrentState, setIscurrentState] = useState("Dashboard");
  const [menuStates, setMenuStates] = useState({}); // dynamic toggle states

  // Permission state, fetched once per session from GET /users/me/permissions.
  // isSuperAdmin === null means "not resolved yet" so we don't flash a
  // restricted menu (or bounce the user to /not-found) before the request lands.
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [permittedLinks, setPermittedLinks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getMyPermissions().then((res) => {
      if (cancelled || !res?.success) return;
      setIsSuperAdmin(!!res.data?.isSuperAdmin);
      setPermittedLinks(res.data?.permittedLinks || []);
    }).catch(() => {
      if (!cancelled) {
        // Fail closed: treat an unresolved permissions check as "no access".
        setIsSuperAdmin(false);
        setPermittedLinks([]);
      }
    });
    return () => { cancelled = true; };
  }, []);

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

  // Guard direct navigation to a URL the current user isn't permitted to see.
  useEffect(() => {
    if (isSuperAdmin === null) return; // still resolving
    if (isSuperAdmin) return;

    const currentPath = location.pathname;
    if (currentPath === "/" || currentPath === "/not-found" || currentPath === "/login") return;

    const isPermitted = permittedLinks.some((path) => currentPath.startsWith(path));
    if (!isPermitted) {
      history("/not-found");
    }
  }, [location.pathname, permittedLinks, isSuperAdmin, history]);



  // Static full-access menu for superadmin
  const menuItems = [

    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/dashboard",
    },

    {
      id: "academic-structure",
      label: "Academic Structure",
      icon: "ri-graduation-cap-line",
      stateVariables: menuStates["AcademicStructure"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, AcademicStructure: !prev.AcademicStructure }));
        setIscurrentState("AcademicStructure");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "program-categories",
          label: "Program Categories",
          link: "/setup/parogram-categories",
          parentId: "academic-structure",
        },
        {
          id: "schools",
          label: "Schools & Faculties",
          link: "/setup/schools",
          parentId: "academic-structure",
        },
        {
          id: "programs",
          label: "Programs",
          link: "/setup/programs",
          parentId: "academic-structure",
        },
        {
          id: "institutions",
          label: "Institutions",
          link: "/setup/institutions",
          parentId: "academic-structure",
        },
      ],
    },

    {
      id: "people-and-partnerships",
      label: "People & Partnerships",
      icon: "ri-building-line",
      stateVariables: menuStates["PeopleAndPartnerships"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, PeopleAndPartnerships: !prev.PeopleAndPartnerships }));
        setIscurrentState("PeopleAndPartnerships");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "staff-directory",
          label: "Staff Directory",
          link: "/setup/staffs",
          parentId: "people-and-partnerships",
        },
        {
          id: "partner-categories",
          label: "Partner Categories",
          link: "/setup/partner-categories",
          parentId: "people-and-partnerships",
        },
        {
          id: "external-partners",
          label: "Partners",
          link: "/setup/partners",
          parentId: "people-and-partnerships",
        },
      ],
    },

    {
      id: "media-and-resources",
      label: "Media & Campus Life",
      icon: "ri-file-list-3-line",
      stateVariables: menuStates["MediaAndResources"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, MediaAndResources: !prev.MediaAndResources }));
        setIscurrentState("MediaAndResources");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "events",
          label: "Events",
          link: "/content/events",
          parentId: "media-and-resources",
        },
        {
          id: "news",
          label: "News & Announcements",
          link: "/content/news",
          parentId: "media-and-resources",
        },
        {
          id: "facilities",
          label: "Campus Facilities",
          link: "/content/facilities",
          parentId: "media-and-resources",
        },
      ],
    },

        {
      id: "university-profile",
      label: "University Profile",
      icon: "ri-settings-3-line",
      stateVariables: menuStates["UniversityProfile"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, UniversityProfile: !prev.UniversityProfile }));
        setIscurrentState("UniversityProfile");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "overview",
          label: "Overview",
          link: "/setting-profile",
          parentId: "university-profile",
        },
        {
          id: "university-info",
          label: "University Info",
          link: "/setting-university",
          parentId: "university-profile",
        },
        {
          id: "senate",
          label: "Senate",
          link: "/setting-senate",
          parentId: "university-profile",
        },
        {
          id: "history",
          label: "Our History",
          link: "/setting/history",
          parentId: "university-profile",
        },
        {
          id: "why-simad",
          label: "Why SIMAD?",
          link: "/setting/why-simad",
          parentId: "university-profile",
        },
        {
          id: "accreditations",
          label: "Accreditations",
          link: "/setting-accreditations",
          parentId: "university-profile",
        },
      ],
    },


    {
      id: "reports",
      label: "Reports",
      icon: "ri-bar-chart-2-line",
      link: "/reports",
    },


    {
      id: "access-control",
      label: "Access Control",
      icon: "ri-team-line",
      stateVariables: menuStates["AccessControl"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, AccessControl: !prev.AccessControl }));
        setIscurrentState("AccessControl");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "users",
          label: "User Accounts",
          link: "/setting-users",
          parentId: "access-control",
        },
        {
          id: "roles",
          label: "Roles & Permissions",
          link: "/setting-roles",
          parentId: "access-control",
        },
      ],
    },


  ];


  // Filter the static menu down to what this user's roles actually permit.
  // Superadmins (and while permissions are still resolving) see everything,
  // so the sidebar doesn't flash empty on first load.
  const visibleMenuItems = (isSuperAdmin === false)
    ? menuItems
      .map((item) => {
        if (!item.subItems) {
          return permittedLinks.includes(item.link) ? item : null;
        }
        const allowedSubItems = item.subItems.filter((sub) => permittedLinks.includes(sub.link));
        return allowedSubItems.length > 0 ? { ...item, subItems: allowedSubItems } : null;
      })
      .filter(Boolean)
    : menuItems;

  return <React.Fragment>{visibleMenuItems}</React.Fragment>;
};

export default Navdata;
