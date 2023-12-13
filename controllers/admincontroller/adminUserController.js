const User = require("../../models/user");

const loadUserList = async (req, res) => {
  const users = await User.find({});
  res.render("usermanage", { users });
};

const loadEditUser = async (req, res) => {
  const id = req.params.id;
  const user = await User.findById({ _id: id });
  res.render("edituser", { user });
};

const editUser = async (req, res) => {
  const id = req.params.id;
  const {blocked } = req.body;
  await User.findByIdAndUpdate(
    { _id: id },
    { $set: {blocked: blocked} }
  );
  res.redirect("/admin/usermanage");
};

const deleteUser = async (req, res) => {
  const id = req.params.id;
  await User.findByIdAndDelete({ _id: id });
  res.redirect("/admin/usermanage");
};

module.exports = { loadUserList, loadEditUser, editUser, deleteUser };
