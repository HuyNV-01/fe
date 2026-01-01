const routes = {
  public: {
    register: "/register",
    login: "/login",
    home: "/",
    forgotPassword: "/forgot-password",
  },
  private: {
    detailChat: (id: string | number) => `/chat/${id}`,
    chat: "/chat",
    contacts: "/contacts",
    addNew: "/contacts/add-new",
    profile: (id: string | number) => `/profile/${id}`,
    directory: "/contacts/directory",
  },
  protected: {
    google: "/auth/google",
  },
};

export default routes;
