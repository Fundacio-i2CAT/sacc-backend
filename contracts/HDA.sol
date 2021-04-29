pragma solidity 0.5.12;

import "./Ownable.sol";

contract HDA is Ownable {
    enum Roles {notRegistered, endUser, doctor, licenseManager, researchInstitutionManager}

    mapping(address => Roles) public userRoles;
    mapping(address => bool) public unregisteredUsers;

    event GrantedAccessUser(address indexed userRequester, Roles indexed roleRequested);

    mapping(address => mapping(address => mapping(address => bool))) public permissionsAllowedFromUser;

    event GrantedAccessToInstitution(address indexed institutionRequester,
        address indexed project,
        address indexed userRequested);
    event RevokedAccessToInstitution(address indexed institutionRequester,
        address indexed project,
        address indexed userRequested);
    event UserUnregistered(address indexed endUser);

    /* event EtherReceived(address indexed payer, uint256 indexed value); */
    function unregisterUser() public {
        require(userRoles[msg.sender] == Roles.endUser, "Only End Users can unregister");
        unregisteredUsers[msg.sender] = true;
        emit UserUnregistered(msg.sender);
    }

    function setUserRole(address payable _user, Roles _role) public payable {
        if(_role == Roles.licenseManager) {
            require(isOwner(), "Only contract owner can create License Managers");
        } else {
            require(userRoles[msg.sender] == Roles.licenseManager,
                    "Only License Managers can create End Users, Doctors and Research Institution Managers");
        }

        userRoles[_user] = _role;

        if(_role == Roles.endUser) {
            _user.transfer(0.05 ether);
        }

        emit GrantedAccessUser(_user, _role);
    }

    function grantPermissionToInstitution(address _requester, address _project) public {
        require(userRoles[msg.sender] == Roles.endUser, "Only End Users can grant access to their data");
        require(userRoles[_requester] == Roles.researchInstitutionManager,
                "Access can only be granted to Research Institution Managers");

        permissionsAllowedFromUser[msg.sender][_requester][_project] = true;

        emit GrantedAccessToInstitution(_requester, _project, msg.sender);
    }

    function revokePermissionToInstitution(address _requester, address _project) public {
        require(userRoles[msg.sender] == Roles.endUser, "Only End Users can revoke access to their data");
        require(permissionsAllowedFromUser[msg.sender][_requester][_project] == true,
                "Access can only be revoked to Research Institution Managers that had it granted");

        permissionsAllowedFromUser[msg.sender][_requester][_project] = false;

        emit RevokedAccessToInstitution(_requester, _project, msg.sender);
    }

    function () external payable {
        /* emit EtherReceived(msg.sender, msg.value); */
    }
}
